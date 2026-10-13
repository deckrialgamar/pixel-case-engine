/* engine.js: a framebuffer pixel renderer. Every scene is drawn into a Uint32Array,
   so nothing is ever anti-aliased and every pixel can be checked against the palette. */
var PX = (function () {
  var W = 192, H = 108, buf = new Uint32Array(W * H), bufs = { '192x108': buf };

  // The palette. One character names one colour. Every colour is cool: its red is below its blue.
  // The three reds at the end are the only exceptions. They are for small marks, never for a ground.
  var HEX = {
    k: '#141b33', K: '#232d52', 1: '#2e3d66', 2: '#465a8c', 3: '#6c82b3', 4: '#9db0d6', 5: '#cdd8ee', 6: '#e9eff9', w: '#ffffff',   // ink to white
    a: '#0a1030',                                                      // night navy, the ground of the text panel
    A: '#8f9df2', B: '#aab6f6', D: '#c6cefa', E: '#e1e5fd',            // a periwinkle sky, top to horizon
    F: '#62c0ea', G: '#8dd5f2', I: '#b9e6f7', J: '#dcf3fb',            // a cyan sky, top to horizon
    n: '#3f44b8', N: '#6a70de', m: '#a9aef3',                          // indigo
    c: '#0d7384', C: '#25a7b8', e: '#8fdde2',                          // teal
    b: '#1f5fd6', L: '#6f9bf0',                                        // blue
    v: '#7440e0', V: '#b79af7', W: '#e6defc',                          // violet
    g: '#2f8a83', h: '#5cb5a4', i: '#a8dccd',                          // green land
    q: '#1b6fb5', Q: '#3d93d6', u: '#7fc0ec',                          // sea
    y: '#dfe6f6', Y: '#f4f7fd',                                        // snow
    s: '#ece6f3', S: '#c3b6d6', d: '#8778a8', M: '#62548f',            // skin, kept cool
    U: '#5b6c99',                                                      // steel
    l: '#35e0d2', o: '#aef7ee',                                        // lamp aqua, for marks and highlights
    X: '#c23b4b', r: '#ff3131', R: '#cc0000'                           // the reds: X for notices and deadlines, r and R flat reds
  };
  var ACCENT = ['X', 'r', 'R'];
  var C = {};
  function u32(hex) { var n = parseInt(hex.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; }
  for (var key in HEX) C[key] = u32(HEX[key]);
  // A story may add colours of its own: PX.add({ z: '#3050a0' }). The build refuses a colour whose red is not below its blue.
  function add(map) { for (var k in map) { HEX[k] = map[k]; C[k] = u32(map[k]); } }

  function size(w, h) { W = w; H = h; var k = w + 'x' + h; buf = bufs[k] || (bufs[k] = new Uint32Array(w * h)); api.W = W; api.H = H; }
  function p(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = C[c]; }
  function r(x, y, w, h, c) {
    x |= 0; y |= 0; w |= 0; h |= 0;
    var x1 = Math.min(W, x + w), y1 = Math.min(H, y + h), v = C[c];
    if (x < 0) x = 0; if (y < 0) y = 0;
    for (var j = y; j < y1; j++) for (var i = x, o = j * W; i < x1; i++) buf[o + i] = v;
  }
  function box(x, y, w, h, c) { r(x, y, w, 1, c); r(x, y + h - 1, w, 1, c); r(x, y, 1, h, c); r(x + w - 1, y, 1, h, c); }
  function ln(x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, e2;
    for (;;) { p(x0, y0, c); if (x0 === x1 && y0 === y1) break; e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  function dash(x0, y0, x1, y1, c, on, off, ph) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)) | 0; on = on || 2; off = off || 2; ph = ph || 0;
    for (var i = 0; i <= n; i++) if (((i + ph) % (on + off) + (on + off)) % (on + off) < on) p(Math.round(x0 + dx * i / (n || 1)), Math.round(y0 + dy * i / (n || 1)), c);
  }
  function disc(cx, cy, rad, c) { for (var j = -rad; j <= rad; j++) for (var i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad + rad * 0.8) p(cx + i, cy + j, c); }
  function ring(cx, cy, rad, c) { for (var j = -rad; j <= rad; j++) for (var i = -rad; i <= rad; i++) { var q = i * i + j * j; if (q <= rad * rad + rad * 0.8 && q > (rad - 1) * (rad - 1) + (rad - 1) * 0.8) p(cx + i, cy + j, c); } }
  function poly(pts, c) {
    var ymin = 1e9, ymax = -1e9, i, n = pts.length;
    for (i = 0; i < n; i++) { ymin = Math.min(ymin, pts[i][1]); ymax = Math.max(ymax, pts[i][1]); }
    for (var y = Math.max(0, ymin | 0); y <= Math.min(H - 1, ymax | 0); y++) {
      var xs = [];
      for (i = 0; i < n; i++) {
        var a = pts[i], b = pts[(i + 1) % n];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort(function (m, q) { return m - q; });
      for (i = 0; i + 1 < xs.length; i += 2) r(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]) + 1, 1, c);
    }
  }
  // checker (m 2), sparse (m 4) or light (m 3) dither over a rectangle
  function dith(x, y, w, h, c, m) {
    m = m || 2;
    for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) {
      var on = m === 2 ? ((i + j) & 1) === 0 : m === 3 ? ((i + j * 2) & 3) === 0 : ((i & 1) === 0 && (j & 1) === 0);
      if (on) p(i, j, c);
    }
  }
  // string-art sprites. '.' and ' ' are clear, every other character is a palette key (after o.map).
  function blit(rows, x, y, o) {
    o = o || {}; x |= 0; y |= 0;
    var map = o.map, flip = o.flip, j, i, ch, row, w;
    if (o.out) {
      for (j = 0; j < rows.length; j++) for (row = rows[j], w = row.length, i = 0; i < w; i++) {
        ch = row[flip ? w - 1 - i : i];
        if (ch !== '.' && ch !== ' ') { p(x + i - 1, y + j, o.out); p(x + i + 1, y + j, o.out); p(x + i, y + j - 1, o.out); p(x + i, y + j + 1, o.out); }
      }
    }
    for (j = 0; j < rows.length; j++) for (row = rows[j], w = row.length, i = 0; i < w; i++) {
      ch = row[flip ? w - 1 - i : i];
      if (ch === '.' || ch === ' ') continue;
      if (map && map[ch] !== undefined) ch = map[ch];
      if (ch) p(x + i, y + j, ch);
    }
  }

  var FONT = {};
  function setFont(json) {
    for (var name in json) {
      var f = json[name], g = {};
      for (var ch in f.glyphs) { var rows = f.glyphs[ch].split('/'), w = 0; rows.forEach(function (s) { w = Math.max(w, s.length); }); g[ch] = { rows: rows, w: w }; }
      FONT[name] = { g: g, space: f.space, base: f.base };
    }
  }
  function glyph(f, ch) { return f.g[ch] || f.g[ch.toUpperCase()] || null; }
  function has(ch, fn) { return ch === ' ' || !!glyph(FONT[fn || 'small'], ch); }
  function tw(s, fn) {
    var f = FONT[fn || 'small'], w = 0;
    for (var i = 0; i < s.length; i++) { var g = s[i] === ' ' ? null : glyph(f, s[i]); w += (g ? g.w : f.space) + 1; }
    return Math.max(0, w - 1);
  }
  // o.f 'small' or 'big', o.a 'l' 'c' 'r', o.sh a shadow colour
  function txt(s, x, y, c, o) {
    o = o || {}; s = String(s);
    var fn = o.f || 'small', f = FONT[fn], width = tw(s, fn);
    if (o.a === 'c') x -= width >> 1; else if (o.a === 'r') x -= width;
    x |= 0; y |= 0;
    if (api.lint) api.lint(s, x, y, width, fn === 'big' ? 7 : 5);
    for (var pass = o.sh ? 0 : 1; pass < 2; pass++) {
      var cx = x + (pass ? 0 : 1), cy = y + (pass ? 0 : 1), col = pass ? c : o.sh;
      for (var i = 0; i < s.length; i++) {
        var g = s[i] === ' ' ? null : glyph(f, s[i]);
        if (!g) { cx += f.space + 1; continue; }
        for (var j = 0; j < g.rows.length; j++) for (var k = 0, row = g.rows[j]; k < row.length; k++) if (row[k] === '#') p(cx + k, cy + j, col);
        cx += g.w + 1;
      }
    }
    return width;
  }

  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // ordered-dither dissolve from frame a to frame b, level 0..16
  function mix(dst, a, b, level, w) {
    for (var i = 0, n = dst.length; i < n; i++) { var x = i % w, y = (i / w) | 0; dst[i] = BAYER[(y & 3) * 4 + (x & 3)] < level ? b[i] : a[i]; }
  }

  var api = {
    W: W, H: H, HEX: HEX, C: C, ACCENT: ACCENT, add: add, size: size, buf: function () { return buf; },
    p: p, r: r, box: box, ln: ln, dash: dash, disc: disc, ring: ring, poly: poly, dith: dith, blit: blit,
    setFont: setFont, tw: tw, txt: txt, has: has, mix: mix, kit: {}
  };
  return api;
})();
if (typeof module !== 'undefined') module.exports = PX;
