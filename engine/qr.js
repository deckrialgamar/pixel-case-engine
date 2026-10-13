/* qr.js: a small QR code encoder, so a story only has to give its web address.
   Byte mode, error correction level M, versions 1 to 10 (up to 213 characters).
   QR.make('https://example.org') returns { n: modules a side, version: 1..10, rows: [strings of 0 and 1] }, or null if the text is too long. */
var QR = (function () {
  // for each version at level M: error correction codewords per block, then [blocks, data codewords in each] once or twice
  var BLOCKS = [null, [10, 1, 16], [16, 1, 28], [26, 1, 44], [18, 2, 32], [24, 2, 43], [16, 4, 27], [18, 4, 31], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  // arithmetic in the field of 256 elements that QR codes use
  var EXP = [], LOG = [];
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function generator(n) { var g = [1]; for (var i = 0; i < n; i++) { var next = []; for (var j = 0; j <= g.length; j++) next[j] = (j < g.length ? mul(g[j], EXP[i]) : 0) ^ (j > 0 ? g[j - 1] : 0); g = next; } return g.reverse(); }
  // the error correction codewords for one block of data
  function correction(data, n) {
    var g = generator(n), rem = []; for (var i = 0; i < n; i++) rem.push(0);
    for (i = 0; i < data.length; i++) { var f = data[i] ^ rem.shift(); rem.push(0); for (var j = 0; j < n; j++) rem[j] ^= mul(g[j + 1], f); }
    return rem;
  }
  function utf8(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.codePointAt(i); if (c > 0xffff) i++;
      if (c < 0x80) out.push(c); else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function dataCount(v) { var b = BLOCKS[v], n = b[1] * b[2]; if (b.length > 3) n += b[3] * b[4]; return n; }
  function room(v) { return dataCount(v) - (v < 10 ? 2 : 3); }                                   // bytes of text a version can hold

  // the text as data codewords, split into blocks, each with its correction, then interleaved
  function codewords(bytes, v) {
    var bits = [], total = dataCount(v), i, j;
    function put(val, len) { for (var k = len - 1; k >= 0; k--) bits.push((val >> k) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    for (i = 0; i < 4 && bits.length < total * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var data = []; for (i = 0; i < bits.length; i += 8) { var q = 0; for (j = 0; j < 8; j++) q = (q << 1) | bits[i + j]; data.push(q); }
    for (i = 0; data.length < total; i++) data.push(i % 2 ? 0x11 : 0xec);
    var spec = BLOCKS[v], ec = spec[0], blocks = [], at = 0;
    for (i = 1; i < spec.length; i += 2) for (j = 0; j < spec[i]; j++) { var d = data.slice(at, at + spec[i + 1]); at += spec[i + 1]; blocks.push({ d: d, e: correction(d, ec) }); }
    var out = [], longest = 0; blocks.forEach(function (b) { longest = Math.max(longest, b.d.length); });
    for (i = 0; i < longest; i++) blocks.forEach(function (b) { if (i < b.d.length) out.push(b.d[i]); });
    for (i = 0; i < ec; i++) blocks.forEach(function (b) { out.push(b.e[i]); });
    return out;
  }

  // the fixed parts of the symbol. m holds the modules, fn marks the ones that carry no data
  function frame(v) {
    var n = 17 + 4 * v, m = [], fn = [], i, j;
    for (i = 0; i < n; i++) { m.push(new Array(n).fill(0)); fn.push(new Array(n).fill(false)); }
    function set(x, y, on) { if (x >= 0 && y >= 0 && x < n && y < n) { m[y][x] = on ? 1 : 0; fn[y][x] = true; } }
    function finder(cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } }
    finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
    for (i = 8; i < n - 8; i++) { set(i, 6, i % 2 === 0); set(6, i, i % 2 === 0); }
    var a = ALIGN[v];
    for (i = 0; i < a.length; i++) for (j = 0; j < a.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === a.length - 1) || (i === a.length - 1 && j === 0)) continue;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(a[i] + dx, a[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    for (i = 0; i < 9; i++) { if (!fn[8][i]) set(i, 8, 0); if (!fn[i][8]) set(8, i, 0); }           // room for the format bits
    for (i = 0; i < 8; i++) { set(n - 1 - i, 8, 0); set(8, n - 1 - i, 0); }
    set(8, n - 8, 1);                                                                             // the dark module
    if (v >= 7) {                                                                                 // the version, twice
      var rem = v; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
      var vb = (v << 12) | rem;
      for (i = 0; i < 18; i++) { var on = (vb >> i) & 1, p = n - 11 + (i % 3), q = (i / 3) | 0; set(p, q, on); set(q, p, on); }
    }
    return { n: n, m: m, fn: fn };
  }
  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x, y) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (((y / 2) | 0) + ((x / 3) | 0)) % 2 === 0; }, function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
    function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; }, function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
  ];
  function format(F, mask) {
    var n = F.n, m = F.m, data = mask, rem = data, i;                                             // level M is 00, so the five bits are the mask alone
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    function bit(k) { return (bits >> k) & 1; }
    for (i = 0; i <= 5; i++) m[i][8] = bit(i);
    m[7][8] = bit(6); m[8][8] = bit(7); m[8][7] = bit(8);
    for (i = 9; i < 15; i++) m[8][14 - i] = bit(i);
    for (i = 0; i < 8; i++) m[8][n - 1 - i] = bit(i);
    for (i = 8; i < 15; i++) m[n - 15 + i][8] = bit(i);
    m[n - 8][8] = 1;
  }
  // how hard a symbol is to read, by the four rules of the standard; lower is better
  function penalty(m, n) {
    var score = 0, x, y, run, dark = 0;
    function line(get) {
      for (var a = 0; a < n; a++) {
        var len = 1, hist = 0;
        for (var b = 1; b < n; b++) { if (get(a, b) === get(a, b - 1)) len++; else { if (len >= 5) score += len - 2; len = 1; } }
        if (len >= 5) score += len - 2;
        for (b = 0; b < n; b++) { hist = ((hist << 1) | get(a, b)) & 0x7ff; if (b >= 10 && (hist === 0x5d0 || hist === 0x05d)) score += 40; }
      }
    }
    line(function (a, b) { return m[a][b]; }); line(function (a, b) { return m[b][a]; });
    for (y = 0; y < n - 1; y++) for (x = 0; x < n - 1; x++) { run = m[y][x]; if (run === m[y][x + 1] && run === m[y + 1][x] && run === m[y + 1][x + 1]) score += 3; }
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) dark += m[y][x];
    score += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
    return score;
  }
  function make(text) {
    var bytes = utf8(String(text)), v = 1, i, x, y;
    while (v <= 10 && room(v) < bytes.length) v++;
    if (v > 10) return null;
    var cw = codewords(bytes, v), F = frame(v), n = F.n, bit = 0, up = true;
    for (x = n - 1; x > 0; x -= 2) {                                                              // the data, two columns at a time, up then down
      if (x === 6) x--;
      for (i = 0; i < n; i++) {
        y = up ? n - 1 - i : i;
        for (var k = 0; k < 2; k++) { var xx = x - k; if (F.fn[y][xx]) continue; F.m[y][xx] = bit < cw.length * 8 ? (cw[bit >> 3] >> (7 - (bit & 7))) & 1 : 0; bit++; }
      }
      up = !up;
    }
    var best = null, bestScore = 1e9, bestMask = 0;
    for (var mk = 0; mk < 8; mk++) {
      var t = { n: n, m: F.m.map(function (row) { return row.slice(); }) };
      for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (!F.fn[y][x] && MASKS[mk](x, y)) t.m[y][x] ^= 1;
      format(t, mk); var s = penalty(t.m, n);
      if (s < bestScore) { bestScore = s; best = t.m; bestMask = mk; }
    }
    return { n: n, version: v, mask: bestMask, rows: best.map(function (row) { return row.join(''); }) };
  }
  return { make: make, room: room };
})();
if (typeof module !== 'undefined') module.exports = QR;
