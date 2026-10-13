/* art.js: what this case draws for itself, on top of the engine's kit.
   The cast, the quay at Tanjung Priok, the cargo ship, the customs gate, the crate of control units,
   the consignment board, THE DEADLOCK and the triangle of the three parties.

   Colour follows the case. Blue is Baltic, teal is Nusantara, violet is Tirta Water, ink and white are
   SIMC and the mediator. One cool red (X) marks formal notices and the deadline, never a ground. */
(function () {
  var p = PX.p, r = PX.r, box = PX.box, ln = PX.ln, dash = PX.dash, disc = PX.disc, poly = PX.poly, txt = PX.txt, tw = PX.tw, K = PX.kit;

  // ---------------------------------------------------------------- the cast
  // Baltic wears blue, Nusantara teal, counsel ink with their side's tie, Tirta Water violet, SIMC ink and white.
  K.addCast({
    rizky: { hair: 'short', hc: 'k', skin: 'S', top: 'C', det: 'e', pants: '1' },            // Rizky, Nusantara's logistics manager
    hendra: { hair: 'short', hc: '5', skin: 'S', top: 'c', det: 'w', pants: 'k', gl: 1 },    // Pak Hendra, Nusantara's director
    ncounsel: { hair: 'bob', hc: 'k', skin: 'S', top: 'K', det: 'C', pants: 'K' },           // counsel for Nusantara
    dmitri: { hair: 'short', hc: '4', skin: 's', top: 'L', det: 'w', pants: '1' },           // Dmitri, Baltic's account manager
    bdir: { hair: 'long', hc: '2', skin: 's', top: 'b', det: 'w', pants: 'k' },              // Baltic's Commercial Director
    legal: { hair: 'bun', hc: '2', skin: 's', top: 'K', det: 'L', pants: 'K', gl: 1 },       // Baltic's legal department
    bcounsel: { hair: 'fade', hc: 'k', skin: 's', top: 'K', det: 'L', pants: 'K' },          // counsel for Baltic
    med1: { hair: 'short', hc: '3', skin: 's', top: 'k', det: 'm', pants: 'k' },             // the first mediator proposed
    mediator: { hair: 'bob', hc: 'k', skin: 'S', top: 'w', det: 'k', pants: 'k' },           // the mediator, a former shipping lawyer
    tirta: { hair: 'bob', hc: 'k', skin: 'd', top: 'v', det: 'V', pants: '1' },              // Tirta Water
    docker: { hair: 'cap', hc: 'c', skin: 'd', top: '5', det: 'C', pants: '2' },             // a port worker
    officer: { hair: 'cap', hc: '1', skin: 'S', top: '2', det: '5', pants: '1' }             // a customs officer
  });

  // ---------------------------------------------------------------- props
  // a striped crate with a label on it: the control units of consignment 5
  K.crate5 = function (x, y, w, h, label, c) { r(x, y, w, h, c || 'L'); r(x, y, w, 2, 'w'); box(x, y, w, h, 'k'); for (var i = 4; i < w - 2; i += 4) r(x + i, y + 3, 1, h - 4, 'b'); if (label) { var lw = tw(label, 'big') + 4; r(x + ((w - lw) >> 1), y + ((h - 9) >> 1), lw, 9, 'w'); txt(label, x + (w >> 1), y + ((h - 9) >> 1) + 1, 'k', { a: 'c', f: 'big' }); } };
  // the customs gate: a booth and a barrier across the lane
  K.tgate = function (x, yb, shut, t) {
    K.block(x, yb, 16, 5, 16, '4', 'w', 'k'); r(x + 3, yb - 13, 10, 6, shut ? '2' : 'J'); box(x + 2, yb - 14, 12, 8, 'k'); K.sign(x + 32, yb - 22, 'CUSTOMS', 'k', 'w');
    r(x + 17, yb - 8, 3, 8, '2'); box(x + 16, yb - 9, 5, 9, 'k');
    if (shut) { for (var i = 0; i < 26; i++) r(x + 20 + i, yb - 7, 1, 2, ((i / 3) | 0) % 2 ? 'w' : 'X'); r(x + 20, yb - 8, 26, 1, 'k'); r(x + 20, yb - 5, 26, 1, 'k'); }
    else { ln(x + 20, yb - 7, x + 34, yb - 22, 'k'); ln(x + 21, yb - 7, x + 35, yb - 22, 'w'); }
  };
  // a board on the wall with the five consignments. st is a string of five states: l late, h held, o on time, . not yet
  K.board = function (x, y, st) {
    r(x, y, 52, 20, 'w'); box(x - 1, y - 1, 54, 22, 'k'); r(x, y, 52, 6, 'k'); txt('CONSIGNMENTS', x + 26, y + 1, 'w', { a: 'c' });
    for (var i = 0; i < 5; i++) { var cx = x + 3 + i * 10, s = st[i]; r(cx, y + 8, 7, 10, s === 'l' ? 'X' : s === 'h' ? '2' : s === 'o' ? 'C' : '5'); box(cx - 1, y + 7, 9, 12, 'k'); txt(String(i + 1), cx + 4, y + 10, s === '.' ? '3' : 'w', { a: 'c' }); }
  };
  // a cargo ship lying at the quay, 86 wide. (x, wy) is its bow end at the waterline
  K.cargo = function (x, wy, t, o) {
    o = o || {}; var y = wy + (o.still ? 0 : K.bob(t, 0, 1)), i, j;
    poly([[x, y - 8], [x + 86, y - 8], [x + 82, y + 2], [x + 6, y + 2]], o.hull || '1'); r(x + 2, y - 8, 83, 1, 'w'); r(x + 6, y, 76, 2, 'k'); r(x + 1, y - 9, 85, 1, 'k');
    r(x + 66, y - 22, 14, 13, 'w'); r(x + 66, y - 22, 14, 1, '5'); r(x + 68, y - 19, 10, 2, '2'); r(x + 68, y - 15, 10, 1, '4'); box(x + 65, y - 23, 16, 15, 'k'); r(x + 72, y - 29, 3, 6, '2'); r(x + 72, y - 29, 3, 2, o.acc || 'b');
    var cols = ['b', 'L', '3', 'C', 'L', 'b', '3', 'L'], st = o.stack || [2, 3, 3, 2, 3, 2, 1];
    for (i = 0; i < st.length; i++) for (j = 0; j < st[i]; j++) { var cx = x + 5 + i * 8, cy = y - 9 - 5 * (j + 1), cc = cols[(i + j * 3) % cols.length]; r(cx, cy, 8, 5, cc); r(cx, cy, 8, 1, 'w'); box(cx, cy, 8, 5, 'k'); }
    if (o.name) txt(o.name, x + 30, y - 6, 'w', { a: 'c' });
    for (i = -3; i < 90; i += 5) p(x + i + (((t * 3) | 0) % 5), wy + 3, 'w');
  };
  // Tanjung Priok: the cyan sky, the sea, the ship at the quay and the quay itself
  K.quay = function (t, o) {
    o = o || {}; var W = PX.W, i;
    K.sky('cyan', 22); K.clouds(t, 'cyan', [[20, 3, 1], [120, 6, 1]]);
    for (i = 0; i < 2; i++) { var gx = 6 + i * 18; r(gx, 12, 1, 9, 'G'); r(gx + 6, 12, 1, 9, 'G'); r(gx - 3, 11, 14, 1, 'G'); r(gx + 1, 14, 5, 1, 'G'); }      // far gantries
    K.sea(21, 13, t);
    if (o.ship !== false) K.cargo(o.shipX === undefined ? 44 : o.shipX, 31, t, { name: o.shipName, acc: 'b' });
    K.crane(160, 35);
    r(0, 33, W, 3, 'w'); r(0, 35, W, 1, '4');
    for (i = 10; i < W; i += 30) { r(i, 31, 3, 4, 'k'); r(i - 1, 31, 5, 1, 'k'); }                                                   // bollards
    K.floor('6', '5', '4');
  };

  // ---------------------------------------------------------------- the opponents of the two fights
  // THE DEADLOCK: the crate of control units and the withheld price, chained together. open 0..1 lifts the shackle
  K.deadlock = function (cx, fy, t, o) {
    o = o || {}; var i, j = o.still ? 0 : ((t * 2) | 0) % 2, op = o.open || 0;
    K.crate5(cx - 38, fy - 27, 31, 27, null); r(cx - 28, fy - 24, 11, 11, 'w'); box(cx - 29, fy - 25, 13, 13, 'k'); txt('5', cx - 23, fy - 22, 'k', { a: 'c', f: 'big' });
    K.safe(cx + 7, fy - 27, 31, 25, false); r(cx + 8, fy - 26, 29, 2, 'c');
    K.sign(cx - 23, fy - 39, 'UNITS', 'b', 'w'); K.money(cx + 22, fy - 39, 'USD 1.1M', 'c');
    for (i = -40; i <= 40; i++) { var c = ((i + 40 + j) & 3) < 2 ? 'w' : 'U'; r(cx + i, fy - 9, 1, 1, 'k'); r(cx + i, fy - 8, 1, 2, c); r(cx + i, fy - 6, 1, 1, 'k'); }
    r(cx - 41, fy - 9, 1, 4, 'k'); r(cx + 41, fy - 9, 1, 4, 'k');
    var sy = fy - 15 - Math.round(op * 5), sx = cx + Math.round(op * 3);
    for (i = 6; i >= 4; i--) K.halfring(sx, sy, i, i === 5 ? '4' : 'k'); r(sx - 6, sy, 3, 4, 'k'); r(sx - 5, sy, 1, 4, '4'); r(sx + 4, sy, 3, op ? 1 : 4, 'k'); r(sx + 5, sy, 1, op ? 1 : 4, '4');
    r(cx - 7, fy - 14, 15, 13, '3'); r(cx - 7, fy - 14, 15, 2, '4'); r(cx + 6, fy - 12, 2, 11, '2'); box(cx - 8, fy - 15, 17, 15, 'k'); disc(cx, fy - 8, 2, 'w'); r(cx, fy - 7, 1, 4, 'w'); p(cx, fy - 8, 'k');
  };
  // a company's head office, for a fight where the other side is a firm and not a person
  K.hqfoe = function (cx, fy, acc, sign) { K.hq(cx - 24, fy + 3, 48, 38, { acc: acc, sign: sign, flag: acc }); };

  // ---------------------------------------------------------------- the three parties and what each holds back, as the memo's first figure has it
  K.triangle = function (t, lit) {
    lit = lit === undefined ? 3 : lit; var ph = (t * 6) | 0;
    function node(cx, cy, name, c, sub) { var w = Math.max(tw(name, 'big'), tw(sub)) + 10; r(cx - (w >> 1), cy - 10, w, 20, 'w'); r(cx - (w >> 1), cy - 10, w, 3, c); box(cx - (w >> 1) - 1, cy - 11, w + 2, 22, 'k'); txt(name, cx, cy - 5, 'k', { a: 'c', f: 'big' }); txt(sub, cx, cy + 4, '2', { a: 'c' }); }
    function rsign(xr, y, s, c) { var w = tw(s) + 6; K.sign(xr - (w >> 1), y, s, c, 'w'); }
    if (lit >= 1) { K.arrow(67, 20, 124, 20, 'b', true, ph); K.sign(95, 6, 'UNITS HELD', 'b', 'w'); K.arrow(124, 32, 67, 32, 'c', true, ph); K.sign(95, 36, 'PRICE HELD', 'c', 'w'); }
    if (lit >= 2) { K.arrow(172, 40, 172, 69, 'c', true, ph); K.arrow(152, 69, 152, 40, 'v', true, ph); rsign(146, 45, 'THE PLANT: LATE', 'c'); rsign(146, 57, 'USD 15,000 A DAY', 'v'); }
    node(34, 26, 'BALTIC', 'b', 'ST PETERSBURG'); node(158, 26, 'NUSANTARA', 'c', 'JAKARTA');
    if (lit >= 2) node(154, 82, 'TIRTA WATER', 'v', 'WEST JAVA');
    if (lit >= 3) { r(4, 72, 92, 20, 'w'); r(4, 72, 3, 20, 'X'); box(3, 71, 94, 22, 'k'); txt('NEITHER CAN FINISH', 52, 75, 'k', { a: 'c' }); txt('THE PROJECT ALONE', 52, 83, 'X', { a: 'c' }); }
  };
})();
