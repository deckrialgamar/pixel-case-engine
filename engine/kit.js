/* kit.js: the drawing kit. Skies, grounds, rooms, furniture, papers, signs, people and the fight screen.
   Every piece here is generic: it belongs to no case. A story draws its own pieces in its own art.js
   and builds its scenes from both. All pieces draw into the framebuffer of engine.js with palette keys. */
(function () {
  var p = PX.p, r = PX.r, box = PX.box, ln = PX.ln, dash = PX.dash, disc = PX.disc, ring = PX.ring, poly = PX.poly, dith = PX.dith, blit = PX.blit, txt = PX.txt, tw = PX.tw, K = PX.kit;

  // ---------------------------------------------------------------- small helpers
  K.ease = function (a, b, t) { var f = Math.max(0, Math.min(1, (t - a) / (b - a))); return f * f * (3 - 2 * f); };
  K.bob = function (t, ph, a) { return Math.round(Math.sin(t * 2.4 + (ph || 0)) * (a || 1)); };
  function hash(i, s) { var q = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return q - Math.floor(q); }
  K.hash = hash;
  K.ellipse = function (cx, cy, rx, ry, c) { for (var j = -ry; j <= ry; j++) { var w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01))); r(cx - w, cy + j, 2 * w + 1, 1, c); } };
  function halfring(cx, cy, rad, c) { for (var j = -rad; j <= 0; j++) for (var i = -rad; i <= rad; i++) { var q = i * i + j * j; if (q <= rad * rad + rad * 0.8 && q > (rad - 1) * (rad - 1) + (rad - 1) * 0.8) p(cx + i, cy + j, c); } }
  K.halfring = halfring;

  // ---------------------------------------------------------------- skies and grounds
  // Two skies: 'periwinkle' and 'cyan'. Each is four bands, dithered where they meet.
  var SKY = { periwinkle: ['A', 'B', 'D', 'E'], cyan: ['F', 'G', 'I', 'J'] };
  K.skyBands = SKY;
  K.sky = function (kind, hz, x0, x1) {
    var c = SKY[kind] || SKY.cyan, x = x0 || 0, w = (x1 === undefined ? PX.W : x1) - x; hz = hz || 80;
    var e = [0, (hz * 0.28) | 0, (hz * 0.55) | 0, (hz * 0.8) | 0, hz];
    for (var i = 0; i < 4; i++) {
      r(x, e[i], w, e[i + 1] - e[i], c[i]);
      if (i) { dith(x, e[i] - 4, w, 2, c[i], 4); dith(x, e[i] - 2, w, 2, c[i], 2); dith(x, e[i], w, 2, c[i - 1], 4); }
    }
  };
  // two skies meeting, for two places in one picture: one kind on the left, the other on the right, dithered across the seam
  K.skies = function (hz, seam, wd, left, right) {
    var W = PX.W; wd = wd || 16; K.sky(left || 'periwinkle', hz, 0, seam + wd); K.sky(right || 'cyan', hz, seam + wd, W);
    var c = SKY[right || 'cyan'], e = [0, (hz * 0.28) | 0, (hz * 0.55) | 0, (hz * 0.8) | 0, hz];
    for (var y = 0; y < hz; y++) {
      var b = y < e[1] ? 0 : y < e[2] ? 1 : y < e[3] ? 2 : 3;
      for (var x = seam - wd; x < seam + wd; x++) { var f = (x - (seam - wd)) / (2 * wd), th = ((x * 3 + y * 5) % 8) / 8; if (f > th) p(x, y, c[b]); }
    }
  };
  var CLOUD = ['.....www.........', '..wwwwwwww..ww...', '.wwwwwwwwwwwwwww.', 'wwwwwwwwwwwwwwwww', '.xxwwwwwwwwwwxx..', '...xxxxxxxxx.....'];
  var CLOUD2 = ['..www....', '.wwwwwww.', 'wwwwwwwww', '.xxxxxx..'];
  // drifting clouds. list is [[x, y, small], ...]
  K.clouds = function (t, kind, list) {
    (list || [[18, 8, 0], [104, 17, 1], [150, 5, 1]]).forEach(function (c, i) {
      var x = ((c[0] + t * (1.2 + i * 0.5)) % (PX.W + 30)) - 20;
      blit(c[2] ? CLOUD2 : CLOUD, x, c[1], { map: { x: kind === 'periwinkle' ? 'E' : 'J' } });
    });
  };
  K.plaza = function (y) { var W = PX.W; y = y || 93; r(0, y, W, PX.H - y, '6'); r(0, y, W, 1, 'w'); r(0, y + 1, W, 1, '5'); for (var i = 9; i < W; i += 22) r(i, y + 8, 9, 1, '5'); };
  K.snow = function (hz, noPlaza) {
    var W = PX.W; r(0, hz, W, PX.H - hz, 'y'); r(0, hz, W, 1, 'Y'); dith(0, hz + 1, W, 2, 'Y', 4);
    for (var i = 5; i < W; i += 17) r(i, hz + 5 + (i % 5), 4, 1, 'Y');
    if (!noPlaza) K.plaza();
  };
  K.sea = function (y, h, t, x0, x1) {
    var x = x0 || 0, w = (x1 === undefined ? PX.W : x1) - x; r(x, y, w, h, 'Q'); r(x, y, w, 1, 'u');
    for (var j = 2; j < h; j += 3) for (var i = (j * 7) % 11; i < w; i += 13) r(x + (i + ((t * (1 + j % 2)) | 0)) % w, y + j, 3, 1, j % 2 ? 'u' : 'q');
  };
  K.coast = function (hz, t, noPlaza) {
    var W = PX.W; K.sea(hz - 14, 14, t || 0); r(0, hz, W, PX.H - hz, 'h'); r(0, hz, W, 1, 'i'); dith(0, hz + 1, W, 2, 'i', 4);
    for (var i = 3; i < W; i += 19) r(i, hz + 5 + (i % 4), 3, 1, 'g');
    if (!noPlaza) K.plaza();
  };
  // a row of green hills with their foot on the line base
  K.hills = function (base, x0, x1) {
    for (var i = x0 || 0; i < (x1 === undefined ? PX.W : x1); i++) { var h = 8 + Math.round(Math.sin(i * 0.06) * 4 + Math.sin(i * 0.021 + 2) * 5); r(i, base - h, 1, h, i % 11 < 6 ? 'h' : 'g'); }
  };

  // ---------------------------------------------------------------- buildings seen from the side
  K.crane = function (x, base) {
    r(x, base - 30, 2, 30, '1'); r(x - 8, base - 30, 30, 2, '1'); ln(x + 1, base - 36, x + 20, base - 30, '1'); ln(x + 1, base - 36, x - 7, base - 30, '1'); r(x, base - 37, 2, 7, '1');
    r(x + 18, base - 28, 1, 12, '2'); r(x + 17, base - 16, 3, 2, '2'); r(x - 8, base - 28, 4, 4, '2');
  };
  K.shed = function (x, base, w, h, roof) {
    r(x, base - h, w, h, '6'); r(x + w - 2, base - h, 2, h, '5'); r(x - 1, base - h - 3, w + 2, 3, roof || 'C'); r(x - 1, base - h - 3, w + 2, 1, 'e');
    r(x + 3, base - 7, 6, 7, '3'); box(x - 1, base - h - 3, w + 2, h + 4, '3');
  };
  // a company or office building. o.acc accent, o.sign text, o.win window colour, o.flag a flag colour
  K.hq = function (x, base, w, h, o) {
    o = o || {}; var acc = o.acc || 'n', top = base - h;
    r(x, top, w, h, '6'); r(x + w - 3, top, 3, h, '5'); r(x, top, w, 1, 'w'); r(x - 1, top - 3, w + 2, 3, acc);
    for (var j = top + 14; j < base - 10; j += 7) for (var i = x + 4; i < x + w - 7; i += 7) { r(i, j, 5, 4, o.win || '3'); r(i, j, 5, 1, o.pane || '4'); }
    var dx = x + (w >> 1) - 4; r(dx, base - 10, 8, 10, acc); r(dx + 4, base - 10, 1, 10, '6'); r(dx - 1, base - 11, 10, 1, '2');
    box(x - 1, top - 3, w + 2, h + 4, '2');
    if (o.sign) { var sw = tw(o.sign) + 6; r(x + ((w - sw) >> 1), top + 3, sw, 9, acc); txt(o.sign, x + (w >> 1), top + 5, 'w', { a: 'c' }); }
    if (o.flag) { r(x + w - 6, top - 14, 1, 11, '1'); r(x + w - 5, top - 14, 6, 4, o.flag); }
  };
  // a row of people seen from behind, for a hall or a hearing
  K.crowd = function (x0, x1, base, n, seed) {
    for (var i = 0; i < n; i++) {
      var q = (i * 7919 + seed * 104729) % 1000, x = x0 + Math.round((x1 - x0 - 6) * i / (n - 1 || 1)) + (q % 3) - 1, hgt = 11 + (q % 4), c = ['1', '2', 'K', '2'][q % 4];
      r(x, base - hgt + 4, 6, hgt - 4, c); r(x + 1, base - hgt, 4, 5, c === '2' ? '1' : '2'); r(x + 2, base - hgt + 2, 2, 2, ['s', 'S', 'd'][q % 3]);
    }
  };

  // ---------------------------------------------------------------- windows that show where a room is
  // kind: 'sea' (cyan sky over water), 'spires' (periwinkle sky, pale spires), 'towers' (a city of towers), 'hills' (green hills)
  K.view = function (x, y, w, h, kind, t) {
    var c = kind === 'spires' ? ['A', 'B', 'D', 'E'] : kind === 'towers' ? ['L', 'u', 'I', 'J'] : ['F', 'G', 'I', 'J'], j, i;
    for (j = 0; j < h; j++) r(x, y + j, w, 1, c[Math.min(3, (j * 4 / h) | 0)]);
    if (kind === 'spires') {
      for (i = 2; i < w - 3; i += 7) { var th = 5 + (i * 5) % 7; r(x + i, y + h - th, 3, th, 'm'); p(x + i + 1, y + h - th - 1, 'm'); p(x + i + 1, y + h - th - 2, 'N'); r(x + i, y + h - th, 1, th, 'w'); }
    } else if (kind === 'towers') {
      for (i = 1; i < w - 3; i += 5) { var tb = 6 + (i * 7) % 8; r(x + i, y + h - tb, 4, tb, '2'); r(x + i, y + h - tb, 1, tb, '4'); if (tb > 9) p(x + i + 2, y + h - tb + 2, 'J'); }
    } else if (kind === 'hills') {
      for (i = 0; i < w; i++) { var hh = 4 + Math.round(Math.sin(i * 0.35) * 2 + Math.sin(i * 0.11 + 1) * 2); r(x + i, y + h - hh, 1, hh, i % 9 < 5 ? 'h' : 'g'); }
    } else { r(x, y + h - 5, w, 5, 'Q'); r(x, y + h - 5, w, 1, 'u'); r(x + 3, y + h - 3, 3, 1, 'u'); r(x + w - 8, y + h - 2, 3, 1, 'u'); }
    box(x - 1, y - 1, w + 2, h + 2, 'w'); box(x - 2, y - 2, w + 4, h + 4, '3'); r(x + (w >> 1), y, 1, h, 'w');
  };
  // an interior seen from the side, for a full-screen picture. o.acc the stripe under the ceiling, o.wins [[x, y, w, h], ...], o.view what they show
  K.room = function (o) {
    o = o || {}; var W = PX.W, H = PX.H, fy = o.fy || 82;
    r(0, 0, W, fy, o.wall || '6'); r(0, 0, W, 4, o.acc || '4'); r(0, 4, W, 1, '5');
    r(0, fy - 3, W, 3, '5'); r(0, fy, W, H - fy, o.floor || '4'); r(0, fy, W, 1, '3'); r(0, fy + 9, W, 1, '5'); r(0, fy + 19, W, 1, '5');
    (o.wins || []).forEach(function (a) { K.view(a[0], a[1], a[2], a[3], o.view || 'sea'); });
  };

  // ---------------------------------------------------------------- signs, papers and small props
  K.sign = function (cx, y, s, bg, fg, o) {
    o = o || {}; var w = tw(s, o.f) + 6, h = o.f === 'big' ? 11 : 9, x = cx - (w >> 1);
    r(x, y, w, h, bg); if (o.edge !== false) box(x, y, w, h, o.edge || 'k'); txt(s, cx, y + 2, fg || 'w', { a: 'c', f: o.f }); return w;
  };
  K.tag = function (cx, y, s) { var w = tw(s) + 4, x = cx - (w >> 1); r(x + 1, y, w - 2, 7, 'k'); r(x, y + 1, w, 5, 'k'); txt(s, cx, y + 1, 'w', { a: 'c' }); };
  K.plate = function (label, c, x, y) { x = x === undefined ? 2 : x; y = y === undefined ? 2 : y; r(x, y, tw(label) + 6, 9, c || 'k'); txt(label, x + 3, y + 2, 'w'); return tw(label) + 6; };
  // a value in a white box with a coloured edge: a sum, a date, a short fact
  K.money = function (cx, y, s, c, o) { o = o || {}; var w = tw(s, o.f) + 8, h = o.f === 'big' ? 11 : 9, x = cx - (w >> 1); r(x, y, w, h, 'w'); box(x, y, w, h, c || 'k'); r(x + 1, y + 1, 2, h - 2, c || 'k'); txt(s, cx + 1, y + 2, 'k', { a: 'c', f: o.f }); return w; };
  K.bar = function (x, y, w, h, f, c, bg) { r(x, y, w, h, bg || 'w'); r(x, y, Math.round(w * Math.max(0, Math.min(1, f))), h, c); box(x - 1, y - 1, w + 2, h + 2, 'k'); };
  // a calendar leaf: the day in large type, the year under it
  K.cal = function (x, y, d, yr, c) { var w = Math.max(tw(d, 'big'), tw(yr)) + 8; r(x, y, w, 21, 'w'); r(x, y, w, 5, c || 'k'); box(x - 1, y - 1, w + 2, 23, 'k'); txt(d, x + (w >> 1), y + 7, 'k', { a: 'c', f: 'big' }); txt(yr, x + (w >> 1), y + 15, '2', { a: 'c' }); return w; };
  K.paper = function (x, y, w, h, o) {
    o = o || {}; r(x, y, w, h, 'w'); box(x - 1, y - 1, w + 2, h + 2, o.edge || '2');
    if (o.head) r(x + 1, y + 1, w - 2, 2, o.head);
    if (o.lines !== false) for (var j = (o.head ? 5 : 2); j < h - 1; j += 2) r(x + 1, y + j, w - 2 - ((j * 3) % 4), 1, '5');
  };
  // a letter: o.acc the letterhead colour, o.head a word under it, o.seal a red seal
  K.letter = function (x, y, w, h, o) {
    o = o || {}; r(x, y, w, h, 'w'); box(x - 1, y - 1, w + 2, h + 2, o.edge || '2');
    r(x + 2, y + 2, w - 4, 2, o.acc || 'k'); if (o.head) txt(o.head, x + 3, y + 6, o.acc || 'k');
    if (o.lines !== false) for (var j = y + (o.head ? 14 : 6); j < y + h - 3; j += 3) r(x + 3, j, w - 7 - ((j * 5) % 9), 1, '5');
    if (o.seal) { disc(x + w - 6, y + h - 6, 3, 'X'); disc(x + w - 6, y + h - 6, 1, 'w'); }
  };
  // a small envelope, for things that fly. c 'X' gives it a red seal
  K.env = function (x, y, c) { r(x, y, 11, 8, 'w'); box(x - 1, y - 1, 13, 10, 'k'); ln(x, y, x + 5, y + 4, c || '2'); ln(x + 10, y, x + 5, y + 4, c || '2'); if (c === 'X') { disc(x + 5, y + 5, 1, 'X'); } };
  // a chat message with its two ticks
  K.chat = function (x, y, w, c) { w = w || 16; r(x + 1, y, w - 2, 9, c || 'C'); r(x, y + 1, w, 7, c || 'C'); p(x + 2, y + 9, c || 'C'); p(x + 3, y + 9, c || 'C'); p(x + 2, y + 10, c || 'C'); r(x + 3, y + 2, w - 8, 1, 'w'); r(x + 3, y + 4, w - 6, 1, 'w'); p(x + w - 6, y + 7, 'w'); p(x + w - 5, y + 6, 'w'); p(x + w - 4, y + 7, 'w'); p(x + w - 3, y + 6, 'w'); };
  K.padlock = function (x, y, c) { halfring(x + 4, y + 3, 3, 'k'); r(x + 1, y + 3, 1, 2, 'k'); r(x + 7, y + 3, 1, 2, 'k'); r(x, y + 4, 9, 7, c || '2'); box(x, y + 4, 9, 7, 'k'); r(x + 4, y + 6, 1, 3, 'w'); };
  // a phone held up, its screen lit in c
  K.phone = function (x, y, c) { r(x, y, 7, 11, 'k'); r(x + 1, y + 1, 5, 8, c || 'e'); p(x + 3, y + 9, '3'); };
  K.seal = function (x, y, c) { disc(x, y, 3, c || 'C'); disc(x, y, 1, 'w'); };
  K.check = function (x, y, c) { c = c || 'C'; p(x, y + 2, c); p(x + 1, y + 3, c); p(x + 2, y + 2, c); p(x + 3, y + 1, c); p(x + 4, y, c); p(x, y + 3, c); p(x + 1, y + 4, c); p(x + 2, y + 3, c); p(x + 3, y + 2, c); p(x + 4, y + 1, c); };
  K.cross = function (x, y, c) { c = c || 'k'; for (var i = 0; i < 5; i++) { p(x + i, y + i, c); p(x + 4 - i, y + i, c); } };
  K.arrow = function (x0, y0, x1, y1, c, dashed, ph) {
    if (dashed) dash(x0, y0, x1, y1, c, 2, 2, ph); else ln(x0, y0, x1, y1, c);
    var dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
    if (dx && !dy) { p(x1 - dx, y1 - 1, c); p(x1 - dx, y1 + 1, c); p(x1 - 2 * dx, y1 - 2, c); p(x1 - 2 * dx, y1 + 2, c); }
    else if (dy && !dx) { p(x1 - 1, y1 - dy, c); p(x1 + 1, y1 - dy, c); p(x1 - 2, y1 - 2 * dy, c); p(x1 + 2, y1 - 2 * dy, c); }
    else { p(x1 - dx, y1, c); p(x1 - 2 * dx, y1, c); p(x1, y1 - dy, c); p(x1, y1 - 2 * dy, c); }
  };
  K.bubble = function (x, y, w, h, tx) {
    r(x + 1, y, w - 2, h, 'w'); r(x, y + 1, w, h - 2, 'w');
    r(x + 1, y - 1, w - 2, 1, 'k'); r(x + 1, y + h, w - 2, 1, 'k'); r(x - 1, y + 1, 1, h - 2, 'k'); r(x + w, y + 1, 1, h - 2, 'k');
    p(x, y, 'k'); p(x + w - 1, y, 'k'); p(x, y + h - 1, 'k'); p(x + w - 1, y + h - 1, 'k');
    if (tx !== undefined) { r(tx, y + h, 3, 1, 'w'); p(tx, y + h + 1, 'k'); p(tx + 1, y + h + 1, 'w'); p(tx + 2, y + h + 1, 'k'); p(tx + 1, y + h + 2, 'k'); }
  };
  K.desk = function (x, y, w, c) { r(x, y, w, 2, 'w'); r(x, y + 2, w, 1, '3'); r(x + 1, y + 3, w - 2, 9, c || '5'); r(x + 1, y + 3, w - 2, 1, '4'); box(x, y - 1, w, 14, '2'); };
  K.chair = function (x, y) { r(x, y, 2, 12, '2'); r(x, y + 7, 8, 2, '2'); r(x + 6, y + 9, 2, 5, '2'); r(x, y + 12, 2, 2, '2'); };
  K.monitor = function (x, y, w, h, scr) { r(x, y, w, h, 'k'); r(x + 1, y + 1, w - 2, h - 2, scr || '1'); r(x + (w >> 1) - 1, y + h, 2, 2, 'k'); r(x + (w >> 1) - 3, y + h + 2, 6, 1, 'k'); };
  K.crate = function (x, y, w, h) { r(x, y, w, h, '4'); box(x, y, w, h, 'k'); r(x + 1, y + 1, w - 2, 1, '5'); ln(x + 1, y + 1, x + w - 2, y + h - 2, '3'); ln(x + w - 2, y + 1, x + 1, y + h - 2, '3'); };
  K.book = function (x, y, w, h) {
    r(x - 1, y + 1, w + 2, h, '1'); r(x, y, w, h, 'w'); r(x + (w >> 1), y, 1, h, '4'); box(x - 1, y - 1, w + 2, h + 2, '2');
    for (var j = 3; j < h - 2; j += 2) r(x + 2, y + j, (w >> 1) - 4 - ((j * 3) % 3), 1, '5');
  };
  K.safe = function (x, y, w, h, open) {
    r(x, y, w, h, '2'); box(x, y, w, h, 'k'); r(x + 2, y + 2, w - 4, h - 4, open ? '1' : '3'); box(x + 2, y + 2, w - 4, h - 4, 'k');
    if (!open) { ring(x + (w >> 1), y + (h >> 1), 3, 'w'); p(x + (w >> 1), y + (h >> 1), 'w'); r(x + w - 5, y + (h >> 1) - 2, 1, 5, 'w'); }
    r(x + 1, y + h, 3, 2, 'k'); r(x + w - 4, y + h, 3, 2, 'k');
  };
  K.folder = function (x, y, w, h, c) { r(x, y, (w * 0.4) | 0, 2, c || 'N'); r(x, y + 2, w, h - 2, c || 'N'); r(x, y + 2, w, 1, 'm'); box(x, y + 2, w, h - 2, 'k'); };
  K.clock = function (cx, cy, rad, hr, mn) {
    disc(cx, cy, rad, 'w'); ring(cx, cy, rad, 'k');
    var a = (hr % 12) / 12 * Math.PI * 2 - Math.PI / 2, b = (mn || 0) / 60 * Math.PI * 2 - Math.PI / 2;
    ln(cx, cy, cx + Math.round(Math.cos(a) * (rad - 3)), cy + Math.round(Math.sin(a) * (rad - 3)), 'k'); ln(cx, cy, cx + Math.round(Math.cos(b) * (rad - 2)), cy + Math.round(Math.sin(b) * (rad - 2)), '2');
  };
  K.gavel = function (x, y, down) { if (down) { r(x, y + 5, 7, 4, '1'); box(x, y + 5, 7, 4, 'k'); ln(x + 6, y + 6, x + 13, y + 3, 'k'); } else { r(x + 2, y, 4, 7, '1'); box(x + 2, y, 4, 7, 'k'); ln(x + 6, y + 4, x + 13, y + 8, 'k'); } r(x - 1, y + 10, 10, 2, '2'); };
  K.pin = function (x, y, c) { disc(x, y - 4, 2, c); p(x, y - 4, 'w'); r(x, y - 2, 1, 3, 'k'); };
  K.coins = function (x, y, n) { for (var i = 0; i < n; i++) { r(x, y - i * 2, 7, 2, '5'); r(x, y - i * 2, 7, 1, 'w'); box(x - 1, y - i * 2 - 1, 9, 4, '2'); } };
  K.stamp = function (x, y) { r(x + 2, y, 4, 3, '1'); r(x + 3, y + 3, 2, 4, '2'); r(x, y + 7, 8, 3, '1'); box(x, y + 7, 8, 3, 'k'); };
  K.flag = function (x, y, c, t) { r(x, y, 1, 14, '1'); var f = ((t || 0) * 4 | 0) & 1; r(x + 1, y + f, 8, 5, c); r(x + 5, y + 1 - f, 4, 5, c); };
  K.dots = function (x, y, t, c) { var n = ((t * 2) | 0) % 4; for (var i = 0; i < n; i++) r(x + i * 3, y, 2, 2, c || 'k'); };
  // a key in four pieces: bow, shaft, first tooth, second tooth. n says how many are cut; the rest are dotted outlines
  K.key = function (x, y, n) {
    function part(i, fn) { fn(n > i ? 'l' : null, n > i ? 'k' : '3'); }
    part(0, function (f, e) { if (f) { disc(x + 6, y + 6, 6, f); disc(x + 6, y + 6, 2, 'K'); ring(x + 6, y + 6, 6, e); ring(x + 6, y + 6, 2, e); } else for (var a = 0; a < 16; a += 2) p(x + 6 + Math.round(Math.cos(a * 0.3927) * 6), y + 6 + Math.round(Math.sin(a * 0.3927) * 6), e); });
    part(1, function (f, e) { if (f) { r(x + 13, y + 5, 30, 3, f); box(x + 12, y + 4, 32, 5, e); } else dash(x + 13, y + 6, x + 43, y + 6, e, 1, 2); });
    part(2, function (f, e) { if (f) { r(x + 28, y + 9, 4, 5, f); box(x + 27, y + 8, 6, 7, e); r(x + 28, y + 8, 4, 1, f); } else { dash(x + 27, y + 9, x + 27, y + 14, e, 1, 1); dash(x + 32, y + 9, x + 32, y + 14, e, 1, 1); } });
    part(3, function (f, e) { if (f) { r(x + 37, y + 9, 4, 7, f); box(x + 36, y + 8, 6, 9, e); r(x + 37, y + 8, 4, 1, f); } else { dash(x + 36, y + 9, x + 36, y + 16, e, 1, 1); dash(x + 41, y + 9, x + 41, y + 16, e, 1, 1); } });
  };
  // the mark that bounces over something the story needs; c 'k' needed, '3' optional
  K.mark = function (cx, y, t, c, ch) { var b = Math.round(Math.abs(Math.sin(t * 5)) * 2); r(cx - 3, y - b - 9, 7, 8, 'w'); box(cx - 4, y - b - 10, 9, 10, c || 'k'); p(cx, y - b, c || 'k'); txt(ch || '!', cx, y - b - 8, c === '3' ? '3' : 'X', { a: 'c' }); };

  // ---------------------------------------------------------------- people
  // The cast is empty here. A story adds its people: K.addCast({ ana: { hair: 'bob', hc: 'k', skin: 's', top: 'b', det: 'w', pants: '1' } }).
  // hair: short, bob, long, fade, bun, bald, cap, curly. hc hair colour. skin: 's', 'S', 'd' or 'M'. top, det (collar and tie), pants: any palette key.
  // gl: 1 for glasses. coat: 1 for a long coat. robe: 1 for a robe.
  var C = K.cast = {};
  K.addCast = function (map) { for (var k in map) C[k] = map[k]; };
  // heads are 9 wide; the fifth entry is how many face rows keep hair at the sides
  var HEADS = {
    short: ['..hhhhh..', '.hhhhhhh.', 'hhhhhhhhh', 'hhssssshh', 1],
    bob: ['..hhhhh..', '.hhhhhhh.', 'hhhhhhhhh', 'hhhsssshh', 4],
    long: ['..hhhhh..', '.hhhhhhh.', 'hhhhhhhhh', 'hhhsssshh', 4],
    fade: ['.........', '.hhhhhhh.', 'hhhhhhhhh', 'hsssssssh', 0],
    bun: ['..hhhhh..', '.hhhhhhh.', 'hhhhhhhhh', 'hsssssshh', 1],
    bald: ['.........', '..sssss..', '.sssssss.', '.sssssss.', 0],
    cap: ['..hhhhh..', '.hhhhhhh.', 'hhhhhhhhh', 'kkkkkkkkk', 0],
    curly: ['.hhhhhhh.', 'hhhhhhhhh', 'hhhhhhhhh', 'hhhsssshh', 2]
  };
  // how many head rows the hair covers when the figure is seen from behind
  var BACK = { short: 6, bob: 8, long: 8, fade: 5, bun: 6, bald: 0, cap: 6, curly: 7 };

  // A person as rows of palette keys, 15 wide and 21 tall, so a figure can be turned and enlarged.
  // o: dir 'd' 'u' 'l' 'r', walk (a frame number), sit, armL armR 'up' 'out', blink
  K.rows = function (who, o) {
    o = o || {}; var c = typeof who === 'string' ? C[who] : who; if (!c) throw new Error('no such person in the cast: ' + who);
    var hd = HEADS[c.hair || 'short'], g = {}, i, j, back = o.dir === 'u';
    var col = { h: c.hc || 'k', s: c.skin, t: c.top, T: c.det, p: c.robe ? c.top : c.pants, f: 'k', k: 'k' };
    function set(x, y, ch) { g[x + ',' + y] = col[ch] || ch; }
    function row(y, s) { for (var q = 0; q < s.length; q++) if (s[q] !== '.') set(q, y, s[q]); }
    for (j = 0; j < 4; j++) row(j, hd[j]);
    for (j = 4; j < 8; j++) { var side = hd[4] > j - 4 ? 'h' : '.'; row(j, j < 7 ? side + 'sssssss' + side : side + '.sssss.' + side); }
    if (c.hair === 'bun') { row(-2, '...hhh...'); row(-1, '...hhh...'); }
    if (back) {
      var hb = BACK[c.hair || 'short'];
      for (j = 3; j < hb; j++) row(j, j < 7 ? 'hhhhhhhhh' : '.hhhhhhh.');
      if (c.hair === 'cap') { row(3, 'hhhhhhhhh'); for (i = 0; i < 9; i++) { g[i + ',4'] = '1'; g[i + ',5'] = '1'; } }
    } else {
      var e = o.dir === 'r' ? [4, 6] : o.dir === 'l' ? [2, 4] : [3, 5];
      if (!o.blink) { g[e[0] + ',4'] = 'k'; g[e[1] + ',4'] = 'k'; }
      g[e[0] + ',5'] = 'k'; g[e[1] + ',5'] = 'k';
      if (c.gl) for (i = e[0] - 1; i <= e[1] + 1; i++) g[i + ',4'] = 'k';
      g[(e[0] + 1) + ',6'] = c.skin === 's' ? 'S' : c.skin === 'S' ? 'd' : 'k';
    }
    row(8, '.ttttttt.'); row(9, back ? '.ttttttt.' : '.ttTTTtt.'); row(10, back ? '.ttttttt.' : '.tttTttt.'); row(11, '.ttttttt.'); row(12, '.ttttttt.');
    if (!o.sit) {
      var L = (o.walk & 1) ? ['.ppppppp.', '..ppppp..', '..ppppp..', '..ppppp..', '..fffff..'] : ['.ppppppp.', '.ppp.ppp.', '.ppp.ppp.', '.ppp.ppp.', '.fff.fff.'];
      for (j = 0; j < 5; j++) row(13 + j, L[j]);
      if (c.robe) for (j = 13; j < 17; j++) row(j, '.ttttttt.'); else if (c.coat) { row(13, '.ttttttt.'); row(14, '.ttttttt.'); }
    }
    function arm(d, pose) {
      var x = d < 0 ? 0 : 8;
      if (pose === 'up') { set(x, 9, 't'); set(x + d, 8, 't'); set(x + 2 * d, 7, 't'); set(x + 2 * d, 6, 's'); }
      else if (pose === 'out') { set(x, 9, 't'); set(x + d, 9, 't'); set(x + 2 * d, 9, 't'); set(x + 3 * d, 9, 's'); }
      else { set(x, 9, 't'); set(x, 10, 't'); set(x, 11, 't'); set(x, 12, 's'); }
    }
    arm(-1, o.armL); arm(1, o.armR);
    if (c.hair === 'long') { set(0, 8, 'h'); set(8, 8, 'h'); if (!o.armL) { set(0, 9, 'h'); set(0, 10, 'h'); } if (!o.armR) { set(8, 9, 'h'); set(8, 10, 'h'); } if (back) { row(8, '.hhhhhhh.'); row(9, '..hhhhh..'); } }
    var rows = [];
    for (j = -3; j <= (o.sit ? 12 : 17); j++) { var s = ''; for (i = -3; i <= 11; i++) s += g[i + ',' + j] || '.'; rows.push(s); }
    return rows;
  };
  // a figure with its feet at fy. Returns the y of the top of its head.
  K.fig = function (who, cx, fy, o) {
    o = o || {}; var y0 = fy - (o.sit ? 13 : 18) - ((o.walk & 1) ? 1 : 0);
    blit(K.rows(who, o), cx - 7, y0 - 3, { out: o.out === undefined ? 'k' : o.out });
    return y0;
  };
  K.shadow = function (cx, fy, w) { w = w || 11; r(cx - (w >> 1), fy, w, 1, '4'); };
  // a figure with a shadow and, if name is given, a name tag over its head
  K.who = function (who, cx, fy, o, name) {
    o = o || {}; if (!o.sit && !o.noShadow) K.shadow(cx, fy);
    var y0 = K.fig(who, cx, fy, o); if (name) K.tag(cx, y0 - 10, name); return y0;
  };
  // a figure only half there: the outline of someone who cannot be reached
  K.ghost = function (who, cx, fy) {
    var c = typeof who === 'string' ? C[who] : who, g = {}; for (var k in c) g[k] = c[k];
    g.hc = '4'; g.skin = '6'; g.top = '5'; g.det = '5'; g.pants = '5';
    return K.fig(g, cx, fy, { out: '4', blink: 1 });
  };

  // ---------------------------------------------------------------- a pixel-art scaler for the fight screen
  // Scale2x and Scale3x (EPX, AdvMAME). They round the stair steps, so an enlarged figure stays a drawing.
  function at(rows, x, y) { return y < 0 || y >= rows.length || x < 0 || x >= rows[y].length ? '.' : rows[y][x]; }
  K.x2 = function (rows) {
    var out = [], h = rows.length, w = rows[0].length;
    for (var y = 0; y < h; y++) {
      var a = '', b = '';
      for (var x = 0; x < w; x++) {
        var P = at(rows, x, y), A = at(rows, x, y - 1), B = at(rows, x + 1, y), Cc = at(rows, x - 1, y), D = at(rows, x, y + 1);
        a += (Cc === A && Cc !== D && A !== B) ? A : P; a += (A === B && A !== Cc && B !== D) ? B : P;
        b += (D === Cc && D !== B && Cc !== A) ? Cc : P; b += (B === D && B !== A && D !== Cc) ? D : P;
      }
      out.push(a, b);
    }
    return out;
  };
  K.x3 = function (rows) {
    var out = [], h = rows.length, w = rows[0].length;
    for (var y = 0; y < h; y++) {
      var r0 = '', r1 = '', r2 = '';
      for (var x = 0; x < w; x++) {
        var A = at(rows, x - 1, y - 1), B = at(rows, x, y - 1), Cc = at(rows, x + 1, y - 1), D = at(rows, x - 1, y), E = at(rows, x, y), F = at(rows, x + 1, y), G = at(rows, x - 1, y + 1), H = at(rows, x, y + 1), I = at(rows, x + 1, y + 1);
        if (B !== H && D !== F) {
          r0 += (D === B ? D : E) + (((D === B && E !== Cc) || (B === F && E !== A)) ? B : E) + (B === F ? F : E);
          r1 += (((D === B && E !== G) || (D === H && E !== A)) ? D : E) + E + (((B === F && E !== I) || (H === F && E !== Cc)) ? F : E);
          r2 += (D === H ? D : E) + (((D === H && E !== I) || (H === F && E !== G)) ? H : E) + (H === F ? F : E);
        } else { r0 += E + E + E; r1 += E + E + E; r2 += E + E + E; }
      }
      out.push(r0, r1, r2);
    }
    return out;
  };
  var bigCache = {};
  // an enlarged figure, feet at fy. scale 2 or 3
  K.big = function (who, cx, fy, scale, o) {
    o = o || {}; var key = (typeof who === 'string' ? who : JSON.stringify(who)) + scale + (o.dir || 'd') + (o.blink ? 'b' : '') + (o.armL || '') + (o.armR || '') + (o.sit ? 's' : '');
    var rows = bigCache[key];
    if (!rows) { rows = K.rows(who, o); rows = scale === 3 ? K.x3(rows) : K.x2(rows); bigCache[key] = rows; }
    blit(rows, cx - ((rows[0].length / 2) | 0), fy - rows.length + scale, { out: 'k' });
    return fy - rows.length + scale;
  };

  // ---------------------------------------------------------------- rooms to walk in, seen from above and in front
  // The back wall takes the top 36 rows. The floor below it is a grid of 12 pixel tiles, 16 across and 6 down.
  var FY = 36, TS = 12;
  K.FY = FY; K.TS = TS;
  K.floor = function (base, seam, edge) {
    var W = PX.W, H = PX.H, j, i;
    r(0, FY, W, H - FY, base); r(0, FY, W, 1, edge || '3');
    for (j = 0; j < 6; j++) { if (j) r(0, FY + j * TS, W, 1, seam); for (i = (j & 1) ? 12 : 0; i < W; i += 24) r(i, FY + j * TS + 1, 1, TS - 1, seam); }
  };
  // the same floor over part of the width, for a screen split into two rooms
  K.floorPart = function (x0, x1, base, seam) {
    var j, i; r(x0, FY, x1 - x0, PX.H - FY, base); r(x0, FY, x1 - x0, 1, '3'); for (j = 1; j < 6; j++) r(x0, FY + j * TS, x1 - x0, 1, seam);
    for (j = 0; j < 6; j++) for (i = x0 + ((j & 1) ? 12 : 0); i < x1; i += 24) if (i > x0) r(i, FY + j * TS + 1, 1, TS - 1, seam);
  };
  // the back wall and the floor. o: acc the owner's stripe, view what the windows show, wins [[x, w], ...], floor [base, seam], wall, sign [text, x, colour], doors [x, ...]
  K.roomTop = function (o, t) {
    o = o || {}; var W = PX.W, f = o.floor || ['5', '6'];
    r(0, 0, W, FY, o.wall || '6'); r(0, 0, W, 3, o.acc || '4'); r(0, 3, W, 1, '5'); r(0, FY - 4, W, 4, '5'); r(0, FY - 4, W, 1, '4');
    (o.wins || []).forEach(function (a) { K.view(a[0], 8, a[1], 17, o.view || 'sea', t); });
    (o.doors || []).forEach(function (x) { r(x, 9, 14, 23, '2'); r(x + 1, 10, 12, 22, '3'); r(x + 2, 11, 10, 9, '4'); r(x + 10, 22, 2, 2, 'w'); box(x - 1, 8, 16, 25, 'k'); });
    if (o.sign) K.sign(o.sign[1], 10, o.sign[0], o.sign[2] || o.acc || 'k', 'w');
    K.floor(f[0], f[1]);
  };
  // a block: a top face d deep and a front face h high, its foot on the line yb
  K.block = function (x, yb, w, d, h, top, front, edge) {
    var y = yb - d - h; r(x, y, w, d, top); r(x, y + d, w, h, front); r(x, y + d, w, 1, edge === 'k' ? '3' : '4'); r(x + w - 2, y, 2, d, front); box(x - 1, y - 1, w + 2, d + h + 2, edge || 'k');
  };
  K.tdesk = function (x, yb, w, o) {
    o = o || {}; K.block(x, yb, w, 7, 6, 'w', o.c || '4', 'k');
    if (o.screen) { r(x + w - 12, yb - 20, 9, 8, 'k'); r(x + w - 11, yb - 19, 7, 6, o.screen); r(x + w - 9, yb - 12, 3, 1, 'k'); }
    if (o.papers) for (var i = 0; i < o.papers; i++) { r(x + 3, yb - 14 - i * 2, 8, 2, 'w'); box(x + 2, yb - 15 - i * 2, 10, 4, '2'); }
    if (o.phone) { r(x + 3, yb - 12, 5, 3, 'k'); p(x + 4, yb - 11, o.phone); }
  };
  // a long meeting table: w wide, its top face d deep
  K.ttable = function (x, yb, w, d, o) { o = o || {}; K.block(x, yb, w, d, 5, 'w', o.c || '4', 'k'); r(x + 2, yb - 5 - d + 2, w - 4, 1, '6'); };
  K.tplant = function (x, yb) { r(x + 3, yb - 6, 6, 6, '3'); r(x + 3, yb - 6, 6, 1, '4'); box(x + 2, yb - 7, 8, 8, 'k'); disc(x + 6, yb - 12, 4, 'g'); disc(x + 4, yb - 14, 2, 'h'); disc(x + 8, yb - 13, 2, 'h'); p(x + 6, yb - 15, 'i'); p(x + 3, yb - 11, 'i'); };
  // a large ribbed box, such as a shipping container: w wide. c its colour, hi its lit top
  K.tbox = function (x, yb, w, c, hi, label) {
    K.block(x, yb, w, 5, 12, hi, c, 'k');
    for (var i = 3; i < w - 1; i += 3) r(x + i, yb - 11, 1, 10, hi);
    if (label) { var lw = tw(label) + 4; r(x + ((w - lw) >> 1), yb - 9, lw, 7, 'w'); txt(label, x + (w >> 1), yb - 8, 'k', { a: 'c' }); }
  };

  // ---------------------------------------------------------------- the fight screen
  // A backdrop is four sky bands, two ground colours and the two pads the sides stand on. A story may add its own: K.arenas.mine = { ... }.
  K.arenas = {
    day: { sky: ['G', 'I', 'J', 'w'], ground: ['J', 'I'], pad: ['w', 'G'] },
    sea: { sky: ['G', 'I', 'J', 'w'], ground: ['6', '5'], pad: ['w', 'G'], sea: true },
    ice: { sky: ['B', 'D', 'E', 'w'], ground: ['E', 'D'], pad: ['w', 'B'] },
    grey: { sky: ['4', '5', '6', 'w'], ground: ['6', '5'], pad: ['w', '4'] },
    violet: { sky: ['V', 'W', 'W', 'w'], ground: ['W', 'V'], pad: ['w', 'V'] },
    dark: { sky: ['a', 'K', '1', '2'], ground: ['K', '1'], pad: ['2', '1'] }
  };
  K.arena = function (theme, t) {
    var W = PX.W, H = PX.H, A = K.arenas[theme] || K.arenas.day, bands = A.sky, g = A.ground, pl = A.pad;
    var e = [0, 18, 36, 52, 66], i;
    for (i = 0; i < 4; i++) { r(0, e[i], W, e[i + 1] - e[i], bands[i]); if (i) { dith(0, e[i] - 2, W, 2, bands[i], 2); dith(0, e[i] - 4, W, 2, bands[i], 4); } }
    r(0, 66, W, H - 66, g[0]); for (i = 0; i < 6; i++) r(0, 68 + i * 7 + ((i * i) >> 1), W, 1, g[1]);
    if (A.sea) { K.sea(52, 14, t); r(0, 65, W, 2, 'w'); }
    K.ellipse(146, 52, 32, 6, pl[1]); K.ellipse(146, 51, 30, 5, pl[0]);
    K.ellipse(46, 104, 42, 8, pl[1]); K.ellipse(46, 103, 40, 7, pl[0]);
  };
  // a name and a bar, the way a fight screen shows them. side 'foe' or 'me'
  K.statbox = function (side, name, label, f, c) {
    var x = side === 'foe' ? 4 : 100, y = side === 'foe' ? 5 : 76, w = 88, h = 23;
    r(x + 1, y, w - 2, h, 'w'); r(x, y + 1, w, h - 2, 'w');
    r(x + 1, y - 1, w - 2, 1, 'k'); r(x + 1, y + h, w - 2, 1, 'k'); r(x - 1, y + 1, 1, h - 2, 'k'); r(x + w, y + 1, 1, h - 2, 'k'); p(x, y, 'k'); p(x + w - 1, y, 'k'); p(x, y + h - 1, 'k'); p(x + w - 1, y + h - 1, 'k');
    r(x + 2, y + h + 1, w - 2, 1, '3');
    txt(name, x + 4, y + 3, 'k');
    if (label) { txt(label, x + 4, y + 10, '2'); K.bar(x + 5, y + 17, w - 10, 3, f, c || 'C', '5'); }
  };
})();
