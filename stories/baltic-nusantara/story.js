/* story.js: the case, act by act. Every line of text on screen is in this file, apart from the engine's own menu words.
   Sources: the Group 7 mediation memo as filed on 12 October 2026 (Part I facts 1 to 11, Part II answers 1 to 4, Annexes A to C) and, for
   March 2026 only, the Group 7 negotiation memo (facts 5 to 8). Acts 1 to 3 are facts. The end roll is the group's proposal.

   This file is the worked example of the engine. It uses every mechanism the engine has: the title picture, rooms with goals,
   choices with a move on the record, two fights, full-screen pictures, the meter in the status strip and the end roll.
   One thing here is this story's own code and not the engine's: the mediator's bag in the two private rooms (look for "bag"). */
(function () {
  var p = PX.p, r = PX.r, box = PX.box, ln = PX.ln, dash = PX.dash, disc = PX.disc, txt = PX.txt, tw = PX.tw, K = PX.kit, S = G.S;
  var say = G.say, menu = G.menu, wait = G.wait, call = G.call, tween = G.tween, par = G.par, free = G.free;
  var FY = K.FY, TS = K.TS;
  function yb(row) { return FY + (row + 1) * TS; }
  var CHARGE = { sep1: 15000, sep15: 225000, sep18: 270000, sep29: 435000, oct6: 540000, oct9: 585000, oct13: 645000 };       // USD 15,000 times the days since 31 August

  // ================================================================ the title
  function drawTitle(t) {
    var W = 192;
    K.skies(58, 96, 26);
    r(0, 51, 50, 7, 'y'); r(0, 51, 50, 1, 'Y');                                                                    // St Petersburg, pale
    [[8, 8], [22, 11], [36, 6]].forEach(function (a) { r(a[0], 51 - a[1], 5, a[1], 'm'); r(a[0], 51 - a[1], 1, a[1], 'w'); r(a[0] + 2, 51 - a[1] - 4, 1, 4, 'N'); p(a[0] + 1, 51 - a[1] - 1, 'm'); p(a[0] + 3, 51 - a[1] - 1, 'm'); });
    r(142, 51, 50, 7, 'h'); r(142, 51, 50, 1, 'i'); K.shed(148, 51, 14, 6, 'c'); r(176, 40, 2, 11, '1'); r(168, 40, 18, 2, '1'); r(170, 42, 1, 5, '2'); // Tanjung Priok, green
    K.sea(58, 34, t);
    dash(44, 68, 150, 68, 'w', 2, 3, (t * 4) | 0);
    K.cargo(30 + ((t * 4) % 60), 80, t, { stack: [2, 3, 3, 2, 3, 2, 1] });
    K.sign(60, 3, 'BALTIC', 'b', 'w'); txt('V', 95, 5, 'k', { a: 'c' }); K.sign(134, 3, 'NUSANTARA', 'c', 'w');
    G.bigTxt('THE MEDIATION', 96, 15, 'k', 2, 'w');
    txt('A CASE IN THREE ACTS', 96, 34, '1', { a: 'c' });
    r(0, 92, W, 16, 'a'); r(0, 92, W, 1, 'K');
    txt('GROUP 7  ·  INTERNATIONAL DISPUTE RESOLUTION', 96, 95, '4', { a: 'c' }); txt('AN ILLUSTRATIVE RECONSTRUCTION', 11, 102, '3'); txt('SCAN TO PLAY', 181, 102, 'l', { a: 'r' });
    G.qr(191, 92, { anchor: 'br', scale: 1, pad: 2, frame: 'k' });                                                // the link in config.js as a code, its corner on the footer
  }
  // ================================================================ act 1: the delay
  var PORT = {
    bd: function (t) { K.quay(t, { shipName: 'CONSIGNMENT 1' }); },
    hero: { who: 'rizky', c: 6, r: 3, tag: 'RIZKY' },
    objs: [
      { id: 'ship', c: 6, r: -1, w: 3, open: true, touch: [[5, -1], [6, -1], [7, -1], [8, -1]], mx: 87, my: 14, on: function* () { yield say('', 'Consignment 1. Baltic\'s equipment for a water plant in West Java.'); } },
      { id: 'b1', c: 0, r: 1, w: 3, draw: function (x, y) { K.tbox(x + 2, y - 1, 32, 'b', 'L'); } },
      { id: 'b2', c: 1, r: 4, w: 2, draw: function (x, y) { K.tbox(x + 1, y - 1, 22, '3', '4'); } },
      { id: 'b3', c: 3, r: 1, w: 2, draw: function (x, y) { K.tbox(x + 2, y - 1, 20, 'C', 'e'); } },
      { id: 'gate', c: 10, r: 1, w: 2, tiles: [[10, 1], [11, 1], [12, 1], [13, 1]], mx: 148, my: 34, draw: function (x, y, t) { K.tgate(x + 2, y - 1, true, t); },
        on: function* () { yield say('CUSTOMS', 'Nyepi, then Eid. Reduced staff from the 18th to the 24th.'); yield say('', 'Unloading and clearance will be late.'); } }
    ],
    actors: [
      { id: 'docker', who: 'docker', c: 4, r: 5, dir: 'r', tag: 'DOCKER', on: function* () { yield say('DOCKER', 'The port is short of staff this week.'); } },
      { id: 'officer', who: 'officer', c: 14, r: 2, dir: 'l' }
    ]
  };
  function* fight1() {
    yield* G.battle({
      theme: 'sea', hud: { date: '17 TO 24 MARCH 2026', place: 'TANJUNG PRIOK' },
      me: { who: 'rizky', name: 'RIZKY', label: 'FAITH IN BALTIC', f: 1, col: 'C' },
      foe: { kind: 'draw', draw: function (x, y) { K.hqfoe(x, y, 'b', 'BALTIC'); }, name: 'BALTIC', label: 'FAITH IN NUSANTARA', f: 1, col: 'b' },
      intro: 'Clause 8.3: notify in writing within two "working calendar days".'
    }, function* (B) {
      var i = yield menu('RIZKY: HOW TO TELL BALTIC', ['WHATSAPP', 'FORMAL NOTICE', 'BOTH'], { canon: 0, col: 'c' });
      if (i === 1) yield say('', 'Baltic read the clause that way. On the record, Rizky did this:');
      if (i === 2) { yield say('', 'Our first memo advised a brief formal email to confirm it.'); yield say('', 'On the record, Rizky sent only this:'); }
      yield G.shoot(B, 'me', 'chat');
      yield say('RIZKY', 'WhatsApp to Dmitri: the port may be late. We are coordinating.');
      yield say('', 'Baltic acknowledges it. To Baltic it is an update, not a notice.');
      yield G.bar(B, 'foe', 0.8);
      yield say('', 'Baltic fears storage costs, demurrage and the deadline.');
      yield G.shoot(B, 'foe', 'notice'); yield G.hit(B, 'me');
      yield say('BALTIC', 'Formal email: a written mitigation plan in 48 hours. Rights reserved.');
      yield G.bar(B, 'me', 0.6);
      yield* G.swap(B, 'me', { who: 'hendra', name: 'PAK HENDRA' });
      yield say('PAK HENDRA', 'No call first? In the holidays?');
      yield G.shoot(B, 'me', 'chat');
      yield say('', 'He replies informally: it is being handled. A call after the holidays.');
      yield G.bar(B, 'foe', 0.5);
      yield G.shoot(B, 'foe', 'notice'); yield G.hit(B, 'me', true);
      yield say('BALTIC', 'Inadequate. Second formal notice.');
      yield G.bar(B, 'me', 0.35);
      yield say('', 'Each side now believes the other is acting in bad faith.');
    });
  }
  // April to August in one picture: the talks run out, the channel goes quiet, the consignments run late, each side takes a hold
  function* months() {
    var v = { cal: '14 APRIL', bar: 11 / 30, talks: 1, quiet: 0, letters: 0, board: 'l....', claims: 0, nlock: 0, block: 0 };
    yield* G.show(function (t) {
      var i, w0 = Math.max(tw(v.cal, 'big'), tw('2026')) + 8;
      r(0, 0, 96, 108, 'E'); r(96, 0, 96, 108, 'J'); r(0, 0, 96, 3, 'b'); r(96, 0, 96, 3, 'c'); r(0, 86, 96, 22, 'D'); r(96, 86, 96, 22, 'I'); r(0, 86, 192, 1, '3');
      K.sign(24, 8, 'BALTIC', 'b', 'w'); K.sign(164, 8, 'NUSANTARA', 'c', 'w'); K.cal(96 - (w0 >> 1), 7, v.cal, '2026', 'k');
      if (v.talks) { txt('THIRTY DAYS FROM 26 MARCH', 96, 36, '2', { a: 'c' }); K.bar(64, 45, 64, 4, v.bar, 'X', '5'); } else K.board(70, 32, v.board);
      K.who('legal', 18, 86, { dir: 'r' }); for (i = 0; i < Math.round(v.letters); i++) { r(28, 82 - i * 2, 10, 2, 'w'); box(27, 81 - i * 2, 12, 4, '3'); }
      K.sign(64, 56, 'CONTROL UNITS', 'b', 'w'); K.crate5(52, 67, 24, 19, null); r(54, 69, 9, 10, 'w'); box(53, 68, 11, 12, 'k'); txt('5', 58, 70, 'k', { a: 'c', f: 'big' }); if (v.block) K.padlock(65, 74, '3');
      K.who('hendra', 174, 86, { dir: 'l' }); K.money(132, 56, 'USD 1.1M', 'c'); K.safe(120, 67, 24, 19, false); r(121, 68, 22, 2, 'c'); if (v.nlock) K.padlock(133, 74, '3');
      if (v.quiet) { K.chat(90, 68, 14, '3'); ln(88, 66, 105, 81, 'X'); ln(89, 66, 106, 81, 'X'); ln(105, 66, 88, 81, 'X'); ln(106, 66, 89, 81, 'X'); }
      if (v.claims) { K.money(42, 94, 'CLAIMS USD 122,400', 'b'); K.money(142, 90, 'CLAIMS USD 38,400', 'c'); K.money(142, 99, '+ USD 148,000 CHARGES', 'c'); }
    }, { date: '14 AND 15 APRIL 2026', place: '', meter: null });
    G.sfx('down'); yield tween(v, 'bar', 0, 1.2, true); v.cal = '25 APRIL'; S.hud.date = '25 APRIL 2026';
    yield say('', 'The thirty days of talks under Clause 21.1 end without agreement.');
    v.talks = 0; v.quiet = 1; v.cal = 'AFTER MARCH'; S.hud.date = 'AFTER MARCH 2026'; yield tween(v, 'letters', 5, 0.8, true);
    yield say('', 'Baltic moves delay news to formal letters. WhatsApp goes quiet.');
    v.cal = 'AUGUST'; S.hud.date = '18 AUGUST 2026'; v.board = 'll...'; yield wait(0.25); v.board = 'lll..'; yield wait(0.25); v.board = 'llll.';
    yield say('', 'Four consignments reach the site late, by 9 to 16 days.');
    v.claims = 1; yield say('', 'Each blames the other and claims penalties under Clause 10.');
    v.cal = '24 AUG'; S.hud.date = '24 AUGUST 2026';
    var i = yield menu('NUSANTARA: USD 1.1 MILLION IS DUE', ['WITHHOLD IT', 'PAY IN FULL'], { canon: 0, col: 'c' });
    if (i === 1) yield say('', 'On the record, Nusantara did not pay.');
    v.nlock = 1; G.sfx('throw2');
    yield say('', 'Nusantara withholds USD 1.1 million, though Clause 14.2 bars set-off.');
    v.cal = '27 AUG'; S.hud.date = '27 AUGUST 2026';
    i = yield menu('BALTIC: CONSIGNMENT 5', ['HOLD IT', 'SHIP IT UNPAID'], { canon: 0, col: 'b' });
    if (i === 1) yield say('', 'On the record, Baltic held it in St Petersburg.');
    v.block = 1; v.board = 'llllh'; G.sfx('throw2');
    yield say('', 'Baltic holds consignment 5, the control units. Notice of arbitration.');
    yield say('', 'Each side now holds what the other cannot do without.');
  }
  function* tirta() {
    var v = { cal: '31 AUG', tri: 2 };
    yield* G.show(function (t) {
      K.sky('cyan', 60); K.clouds(t, 'cyan'); for (var i = 0; i < 192; i++) { var h = 8 + Math.round(Math.sin(i * 0.06) * 4 + Math.sin(i * 0.021 + 2) * 5); r(i, 60 - h, 1, h, i % 11 < 6 ? 'h' : 'g'); }
      r(0, 60, 192, 48, 'i'); r(0, 60, 192, 1, 'h'); for (i = 6; i < 192; i += 17) r(i, 70 + (i % 5) * 6, 5, 1, 'h');
      K.hq(70, 92, 72, 46, { acc: 'v', sign: 'TIRTA WATER', win: 'V', pane: 'W' });
      disc(56, 80, 9, 'w'); K.halfring(56, 80, 9, 'k'); r(47, 80, 19, 12, 'w'); box(46, 80, 21, 13, 'k'); r(47, 84, 19, 1, '5');
      dash(150, 74, 172, 74, 'X', 2, 2); dash(150, 92, 172, 92, 'X', 2, 2); dash(150, 74, 150, 92, 'X', 2, 2); dash(172, 74, 172, 92, 'X', 2, 2); txt('?', 161, 79, 'X', { a: 'c', f: 'big' }); txt('CONTROL UNITS', 161, 96, '2', { a: 'c' });
      K.who('tirta', 30, 100, { dir: 'r' }, 'TIRTA WATER'); K.cal(6, 8, v.cal, '2026', 'v');
    }, { date: '31 AUGUST 2026', place: 'WEST JAVA', meter: null });
    yield say('', 'The plant is for Tirta Water, a regional utility. Due on 31 August.');
    v.cal = '1 SEP'; yield* G.advance('1 SEPTEMBER 2026', CHARGE.sep1);
    yield say('TIRTA WATER', 'From today: USD 15,000 for each day of delay.');
    yield say('', 'The charge caps at USD 750,000 on 20 October.');
    yield say('', 'Then it may terminate, and bar Nusantara from public tenders.');
    yield* G.show(function (t) {
      r(0, 0, 192, 108, '6'); r(0, 100, 192, 8, '5'); K.triangle(t, v.tri);
    });
    v.tri = 2; yield say('', 'If Tirta Water terminates, Nusantara cannot pay Baltic.');
    yield say('', 'Consignment 5 has no buyer. Baltic loses its route into Indonesia.');
    yield say('', 'Nusantara wants Baltic to share it: Baltic\'s shipments ran late too.');
    v.tri = 3; yield say('', 'The same deadline runs against both of them.');
  }
  function* act1() {
    yield* G.card({ kicker: 'ACT 1', title: 'THE DELAY', sub: 'TANJUNG PRIOK, MARCH 2026', note: 'BALTIC SHIPS WATER-TREATMENT EQUIPMENT FROM ST PETERSBURG. NUSANTARA LANDS IT IN INDONESIA.', acc: 'e', plain: 'Tanjung Priok, March 2026. Baltic ships water-treatment equipment from St Petersburg. Nusantara lands it in Indonesia.' });
    yield* G.enter(PORT, { date: '17 MARCH 2026', place: 'TANJUNG PRIOK', meter: null });
    yield say('', 'You are Rizky, logistics manager at Nusantara.');
    yield free({ need: ['ship', 'gate'], goals: { ship: 'LOOK AT THE SHIP', gate: 'ASK AT THE CUSTOMS GATE' } });
    yield G.emote('hero', '!');
    yield say('RIZKY', 'Baltic has to be told.');
    yield* fight1();
    yield* months();
    yield* tirta();
  }

  // ================================================================ act 2: why mediate
  function needCard(x, y, w, c, head, a, b) { r(x, y, w, 34, 'w'); r(x, y, w, 9, c); box(x - 1, y - 1, w + 2, 36, 'k'); txt(head, x + (w >> 1), y + 2, 'w', { a: 'c' }); txt(a, x + (w >> 1), y + 14, 'k', { a: 'c' }); txt(b, x + (w >> 1), y + 24, 'k', { a: 'c' }); }
  function* interests() {
    var v = { n: 0 };
    yield* G.show(function (t) {
      r(0, 0, 192, 108, '6'); r(0, 0, 192, 3, 'k'); r(0, 88, 192, 20, '5'); r(0, 88, 192, 1, '3');
      K.sign(96, 8, 'WHAT EACH SIDE NEEDS', 'k', 'w');
      if (v.n >= 1) needCard(6, 22, 86, 'b', 'BALTIC NEEDS', 'ITS USD 1.1 MILLION', 'ITS DISTRIBUTOR');
      if (v.n >= 2) needCard(100, 22, 86, 'c', 'NUSANTARA NEEDS', 'THE CONTROL UNITS', 'THE TIRTA CONTRACT');
      if (v.n >= 3) K.money(96, 64, 'NEITHER CAN FINISH THE PROJECT ALONE', 'X');
      K.who('bdir', 30, 102, { dir: 'r' }); K.who('hendra', 162, 102, { dir: 'l' });
    }, { date: 'EARLY SEPTEMBER 2026', place: '', meter: null, note: 'USD 15,000 A DAY' });
    v.n = 1; yield say('', 'Baltic needs {its USD 1.1 million} and {its distributor} in Indonesia.', { hi: 'b' });
    v.n = 2; yield say('', 'Nusantara needs {the control units} and {the Tirta Water contract}.', { hi: 'c' });
    v.n = 3; yield say('', 'Neither can finish the project alone, and the charge runs daily.');
  }
  // the one fight both sides share: the ways out, and why three of them are shut
  var WAYS = [['ARBITRATE', 'TOO SLOW', 'An SIAC award would come far too late for either side.'], ['WALK AWAY', 'NOT ALONE', 'Neither can finish the project alone.'], ['TALK AGAIN', 'FAILED', 'The April talks under Clause 21.1 already failed.']];
  function* fightWhy() {
    var tried = [0, 0, 0];
    function left() { return (4 - tried[0] - tried[1] - tried[2]) / 4; }
    yield* G.battle({
      theme: 'dark', hud: { date: 'EARLY SEPTEMBER 2026', place: '', meter: null, note: 'USD 15,000 A DAY' },
      me: { kind: 'pair', pair: ['bdir', 'hendra'], name: 'BALTIC + NUSANTARA', label: 'WAYS OUT', f: 1, col: 'l' },
      foe: { kind: 'draw', draw: function (x, y, t) { K.deadlock(x, 55, t); }, name: 'THE DEADLOCK', label: 'CAP ON 20 OCTOBER', f: 0.04, col: 'X' },
      intro: 'The deadlock: control units held against the price.'
    }, function* (B) {
      B.over = function () {
        WAYS.forEach(function (q, i) {
          var y = 31 + i * 8, s = q[0] + (tried[i] ? ': ' + q[1] : ''), w = tw(s) + (tried[i] ? 13 : 6);
          r(4, y, w, 7, tried[i] ? '1' : 'w'); box(3, y - 1, w + 2, 9, 'k'); if (tried[i]) K.cross(6, y + 1, 'X'); txt(s, tried[i] ? 14 : 7, y + 1, tried[i] ? 'w' : 'k');
        });
      };
      for (;;) {
        var i = yield menu('WHAT NOW', ['ARBITRATE', 'WALK AWAY', 'TALK AGAIN', 'A THIRD PARTY'], { canon: 3 });
        if (i === 3) break;
        yield G.shoot(B, 'me', 'card', { c: '3' }); tried[i] = 1; G.sfx('no');
        yield say('', WAYS[i][2]); yield G.bar(B, 'me', left());
      }
      if (left() > 0.25) { tried = [1, 1, 1]; G.sfx('no'); yield G.bar(B, 'me', 0.25); yield say('', 'Arbitration is too slow. Talks failed. Neither can finish alone.'); }
      yield G.shoot(B, 'me', 'call'); yield G.hit(B, 'foe');
      yield say('', 'Pak Hendra asks a retired diplomat, once posted in Moscow, to call.');
      yield say('BALTIC', 'A third party, yes. But under written institutional rules.');
      yield tween(B.foe, 'f', CHARGE.sep15 / 750000, 0.6, true); yield* G.advance('15 SEPTEMBER 2026', CHARGE.sep15);
      yield say('', 'They agree to mediate at SIMC. No arbitration before 31 October.');
    });
  }
  function* mediatorScene() {
    var v = { who: 'med1', x: 0, ok: 0, cal: '2 OCT' };
    yield* G.show(function (t) {
      r(0, 0, 192, 108, '6'); r(0, 0, 192, 3, 'k'); r(0, 86, 192, 22, '5'); r(0, 86, 192, 1, '3');
      K.sign(96, 8, 'SIMC PROPOSES A MEDIATOR', 'k', 'w');
      K.letter(72, 22, 48, 58, { acc: 'k', lines: false }); r(78, 30, 36, 30, v.who === 'med1' ? 'E' : 'J'); box(78, 30, 36, 30, '3'); K.fig(v.who, 96, 58, {}); r(78, 64, 30, 1, '5'); r(78, 67, 34, 1, '5'); r(78, 70, 24, 1, '5'); r(78, 73, 32, 1, '5');
      if (v.x) { for (var i = 0; i < 5; i++) { ln(78 + i, 30, 108 + i, 60, 'X'); ln(108 + i, 30, 78 + i, 60, 'X'); } }
      if (v.ok) { K.check(100, 68, 'C'); K.check(106, 68, 'b'); }
      K.who('hendra', 30, 86, { dir: 'r' }, 'NUSANTARA'); K.who('bdir', 162, 86, { dir: 'l' }, 'BALTIC');
      K.cal(152, 8, v.cal, '2026', v.cal === '9 OCT' ? 'X' : 'k');
    }, { date: '15 SEPTEMBER 2026' });
    yield* G.advance('18 SEPTEMBER 2026', CHARGE.sep18);
    yield say('SIMC', 'A Singaporean mediator of Russian descent.');
    yield say('', 'Eight years of work for exporters from Russia and Central Asia.');
    var i = yield menu('NUSANTARA', ['OBJECT', 'ACCEPT'], { canon: 0, col: 'c' });
    if (i === 1) yield say('', 'On the record, Nusantara objected.');
    yield say('NUSANTARA', 'Qualified. But he would not look neutral to management and staff.');
    yield say('BALTIC', 'The objection is unfounded. We do not oppose it.');
    v.x = 1; G.sfx('no'); yield wait(0.7); v.x = 0; v.who = 'mediator';
    yield say('SIMC', 'Then a former shipping lawyer. She works in English and Malay.');
    v.ok = 1; yield* G.advance('29 SEPTEMBER 2026', CHARGE.sep29);
    v.cal = '9 OCT'; G.sfx('down');
    yield say('', 'Both accept. The session slips from 2 to 9 October: USD 105,000 more.');
  }
  function* act2() {
    yield* G.card({ kicker: 'ACT 2', title: 'WHY MEDIATE', sub: 'SEPTEMBER 2026', note: 'THE CHARGE IS RUNNING. WHAT DOES EACH SIDE NEED, AND WHAT WAYS OUT ARE LEFT?', acc: 'l', plain: 'September 2026. The charge is running. What does each side need, and what ways out are left?' });
    yield* interests();
    yield* fightWhy();
    yield* mediatorScene();
  }

  // ================================================================ act 3: the mediation
  var JOINT = {
    bd: function (t) { K.roomTop({ acc: 'k', view: 'towers', wins: [[10, 40], [142, 40]], floor: ['5', '6'], sign: ['SIMC', 96, 'k'] }, t); },
    hero: { who: 'mediator', c: 8, r: 0, tag: 'THE MEDIATOR' },
    objs: [{ id: 'table', c: 5, r: 3, w: 6, tiles: [[5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3]], draw: function (x, y) { K.ttable(x + 1, y - 2, 70, 27); for (var i = 0; i < 3; i++) { r(x + 5, y - 28 + i * 9, 7, 5, 'w'); box(x + 4, y - 29 + i * 9, 9, 7, 'L'); r(x + 60, y - 28 + i * 9, 7, 5, 'w'); box(x + 59, y - 29 + i * 9, 9, 7, 'C'); } r(x + 31, y - 22, 9, 6, '5'); box(x + 30, y - 23, 11, 8, '3'); } }],
    actors: [
      { id: 'bdir', who: 'bdir', c: 3, r: 1, dir: 'r', tag: 'BALTIC', on: function* () { yield say('', 'Baltic\'s Commercial Director reads a prepared statement.'); yield say('BALTIC', '"Recognition that the contract was not followed."'); } },
      { id: 'bcounsel', who: 'bcounsel', c: 3, r: 2, dir: 'r', tag: 'COUNSEL', col: 'b' },
      { id: 'dmitri', who: 'dmitri', c: 3, r: 3, dir: 'r', tag: 'DMITRI' },
      { id: 'hendra', who: 'hendra', c: 12, r: 1, dir: 'l', tag: 'PAK HENDRA', on: function* () { yield say('', 'Pak Hendra speaks without notes, about the partnership.'); yield say('PAK HENDRA', '"Between partners there should not be letters like these."'); } },
      { id: 'ncounsel', who: 'ncounsel', c: 12, r: 2, dir: 'l', tag: 'COUNSEL', col: 'c' },
      { id: 'rizky', who: 'rizky', c: 12, r: 3, dir: 'l', tag: 'RIZKY' }
    ]
  };
  // THE BAG. This is the story's own mechanism, written here and not in the engine: an example of custom story code.
  // What the mediator hears in the two rooms. What she may carry goes into her bag (the panel under the room);
  // what stays is pinned to the wall of the room it was said in. It hangs on three hooks a room offers:
  // bd (the backdrop), over (drawn on top of the room) and panel (drawn in the text panel while nobody speaks).
  var bag = { nb: [], bn: [], ns: [], bs: [], pop: null };
  function chip(x, y, s, kind) { var w = tw(s) + 6; if (kind === 'carry') { r(x, y, w, 7, 'l'); txt(s, x + 3, y + 1, 'a'); return w; } r(x, y, w + 1, 7, '1'); r(x, y, 2, 7, 'X'); txt(s, x + 4, y + 1, 'w'); return w + 1; }
  function pinned(list, x0, x1) { var x = x0, y = 16; list.forEach(function (s) { var w = tw(s) + 7; if (x + w > x1) { x = x0; y += 8; } chip(x, y, s, 'stay'); x += w + 2; }); }
  function bagRow(y, label, list) {
    txt(label, 13, y + 1, '4'); var x = 66;
    for (var i = 0; i < 2; i++) { if (list[i]) x += chip(x, y, list[i], 'carry') + 3; else { dash(x, y, x + 40, y, '2', 2, 2); dash(x, y + 6, x + 40, y + 6, '2', 2, 2); dash(x, y, x, y + 6, '2', 2, 2); dash(x + 40, y, x + 40, y + 6, '2', 2, 2); x += 44; } }
  }
  // a card that pops out over the speaker, then goes to the bag or to the wall
  function* pop(kind, s, room) {
    var W = S.world, sp = W.subItem || W.hero, q = bag.pop = { s: s, kind: kind, x: Math.max(40, Math.min(152, sp.x)), y: sp.y - 46 };
    G.sfx('pop'); yield wait(0.75);
    yield par([tween(q, 'x', kind === 'carry' ? q.x : (room === 'n' ? 42 : 146), 0.35), tween(q, 'y', kind === 'carry' ? 112 : 12, 0.35)]);
    bag.pop = null; (kind === 'carry' ? (room === 'n' ? bag.nb : bag.bn) : (room === 'n' ? bag.ns : bag.bs)).push(s); G.sfx(kind === 'carry' ? 'key' : 'move');
  }
  var ROOMS = {
    bd: function (t) {
      K.roomTop({ acc: 'k', wins: [], floor: ['5', '6'] }, t);
      r(0, 0, 90, 3, 'c'); r(102, 0, 90, 3, 'b'); K.sign(42, 5, 'NUSANTARA\'S ROOM', 'c', 'w'); K.sign(146, 5, 'BALTIC\'S ROOM', 'b', 'w');
      K.floorPart(0, 86, 'J', 'I'); K.floorPart(94, 192, 'E', 'D');
      pinned(bag.ns, 3, 84); pinned(bag.bs, 101, 190);
    },
    over: function () {
      var q = bag.pop; if (!q) return;
      var carry = q.kind === 'carry', head = carry ? 'SHE MAY CARRY THIS' : 'THIS STAYS HERE', w = Math.max(tw(q.s), tw(head)) + 10, x = Math.round(q.x - w / 2), y = Math.round(q.y);
      r(x, y, w, 18, 'w'); r(x, y, w, 8, carry ? 'l' : 'X'); box(x - 1, y - 1, w + 2, 20, 'k'); txt(head, x + (w >> 1), y + 1, carry ? 'a' : 'w', { a: 'c' }); txt(q.s, x + (w >> 1), y + 11, 'k', { a: 'c' });
    },
    panel: function (t, py) { bagRow(py + 13, 'TO BALTIC', bag.nb); bagRow(py + 22, 'TO NUSANTARA', bag.bn); },
    hero: { who: 'mediator', c: 5, r: 4, dir: 'u', tag: 'THE MEDIATOR' },
    objs: [
      { id: 'wall', c: 7, r: 3, w: 1, tiles: [[7, 0], [7, 1], [7, 2], [7, 3], [7, 5]], draw: function (x, y) { r(x + 2, 32, 8, y - 40, 'w'); r(x + 8, 32, 2, y - 40, '5'); r(x + 2, y - 8, 8, 8, '4'); box(x + 1, 31, 10, y - 30, 'k'); r(x + 2, y - 8, 8, 1, '3'); } },
      { id: 'wall2', c: 7, r: 5, w: 1, tiles: [], draw: function (x, y) { r(x + 2, y - 12, 8, 12, 'w'); r(x + 8, y - 12, 2, 12, '5'); box(x + 1, y - 13, 10, 14, 'k'); } },
      { id: 't1', c: 2, r: 2, w: 2, draw: function (x, y) { K.ttable(x + 1, y - 2, 22, 8); } }, { id: 't2', c: 11, r: 2, w: 2, draw: function (x, y) { K.ttable(x + 1, y - 2, 22, 8); } }
    ],
    actors: [
      { id: 'hendra', who: 'hendra', c: 2, r: 1, dir: 'd', tag: 'PAK HENDRA', on: function* () {
        yield say('PAK HENDRA', '{Control units} and {Baltic\'s engineers} on site before 20 October.', { hi: 'c' });
        yield say('', 'In private, Nusantara concedes: its <broker filed consignment 2 late>.');
        yield* pop('stay', 'BROKER ERROR', 'n');
        yield say('', 'He will not sign a text that says Nusantara breached.'); } },
      { id: 'rizky', who: 'rizky', c: 1, r: 4, dir: 'r', tag: 'RIZKY' },
      { id: 'ncounsel', who: 'ncounsel', c: 4, r: 1, dir: 'd', tag: 'COUNSEL', col: 'c', on: function* () {
        yield say('NUSANTARA', 'You may tell Baltic: [part of the price] when consignment 5 ships.');
        yield* pop('carry', 'PART PAYMENT', 'n');
        yield say('NUSANTARA', 'And that we want the [March notices] dealt with.');
        yield* pop('carry', 'MARCH NOTICES', 'n');
        yield say('NUSANTARA', 'The <tender bar> and our <cash position> stay in this room.');
        yield* pop('stay', 'TENDER BAR', 'n'); yield* pop('stay', 'CASH', 'n'); } },
      { id: 'bdir', who: 'bdir', c: 11, r: 1, dir: 'd', tag: 'BALTIC', on: function* () {
        yield say('BALTIC', '{The USD 1.1 million}. And {our distributor}: we mean to keep it.', { hi: 'b' });
        yield say('', 'In private, Baltic concedes: it <timed March for its quarter end>.');
        yield* pop('stay', 'QUARTER END', 'b');
        yield say('', 'Baltic\'s auditors need a documented reason for any waiver.'); } },
      { id: 'dmitri', who: 'dmitri', c: 14, r: 4, dir: 'l', tag: 'DMITRI' },
      { id: 'bcounsel', who: 'bcounsel', c: 13, r: 1, dir: 'd', tag: 'COUNSEL', col: 'b', on: function* () {
        yield say('BALTIC', 'You may tell them: [consignment 5 ships] against part payment.');
        yield* pop('carry', 'CONSIGNMENT 5', 'b');
        yield say('BALTIC', 'And we are open to a [joint record] in place of the March notices.');
        yield* pop('carry', 'JOINT RECORD', 'b');
        yield say('BALTIC', 'Our <routing choice> and <how few options> we have stay here.');
        yield* pop('stay', 'ROUTE', 'b'); yield* pop('stay', 'FEW OPTIONS', 'b'); } }
    ]
  };
  function offerCard(x, y, w, c, a, b) { r(x, y, w, 19, 'w'); r(x, y, w, 3, c); box(x - 1, y - 1, w + 2, 21, 'k'); txt(a, x + (w >> 1), y + 5, 'k', { a: 'c' }); txt(b, x + (w >> 1), y + 12, 'k', { a: 'c' }); }
  function* gap() {
    yield* G.show(function (t) {
      r(0, 0, 96, 108, 'J'); r(96, 0, 96, 108, 'E'); r(0, 0, 96, 3, 'c'); r(96, 0, 96, 3, 'b');
      txt('FOR BALTIC TO HEAR', 48, 8, '1', { a: 'c' }); txt('FOR NUSANTARA TO HEAR', 144, 8, '1', { a: 'c' });
      offerCard(4, 18, 80, 'c', 'PART OF THE PRICE', 'WHEN 5 SHIPS'); offerCard(108, 18, 80, 'b', '5 SHIPS AGAINST', 'PART PAYMENT');
      offerCard(4, 46, 80, 'c', 'THE MARCH NOTICES', 'DEALT WITH'); offerCard(108, 46, 80, 'b', 'A JOINT RECORD', 'IN THEIR PLACE');
      var ph = (t * 5) | 0; dash(86, 27, 106, 27, 'X', 2, 2, ph); dash(86, 55, 106, 55, 'X', 2, 2, ph); txt('?', 96, 34, 'X', { a: 'c', f: 'big' });
      r(0, 84, 192, 24, '5'); r(0, 84, 192, 1, '3'); K.who('mediator', 96, 100, {}, 'THE MEDIATOR');
    }, { date: '9 OCTOBER 2026', place: 'SIMC' });
    yield say('', 'That is all she may carry. Neither delegation can settle alone.');
    yield say('', 'In private, each side admits it caused part of the delays.');
    yield say('', 'She adjourns to 13 October. Each team must get authority.');
  }
  function* act3() {
    yield* G.card({ kicker: 'ACT 3', title: 'THE MEDIATION', sub: 'SIMC, SINGAPORE, FRIDAY 9 OCTOBER 2026', note: 'ONE HOUR TOGETHER. THEN TWO ROOMS.', acc: 'w', plain: 'SIMC, Singapore, Friday 9 October 2026. One hour together. Then two rooms.' });
    yield* G.enter(JOINT, { date: '9 OCTOBER 2026', place: 'SIMC', meter: CHARGE.oct9 });
    yield say('', 'You are the mediator. Hear both sides.');
    yield free({ need: ['bdir', 'hendra'], goals: { bdir: 'HEAR BALTIC', hendra: 'HEAR NUSANTARA' } });
    yield par([G.emote('bcounsel', '!', 1.1), G.emote('ncounsel', '!', 1.1)]);
    yield say('', 'Then counsel argue over Clause 10.3.'); yield say('', 'No penalty "to the extent" the other side or the port caused it.');
    yield par([G.emote('dmitri', '.', 1.1), G.emote('rizky', '.', 1.1)]);
    yield say('', 'Dmitri and Rizky ran every shipment together. They say nothing.');
    var i = yield menu('AN HOUR HAS PASSED', ['STAY TOGETHER', 'TWO ROOMS'], { canon: 1 });
    if (i === 0) yield say('', 'On the record, after an hour she moved to private sessions.');
    bag.nb = []; bag.bn = []; bag.ns = []; bag.bs = []; bag.pop = null;
    yield* G.enter(ROOMS, { date: '9 OCTOBER 2026', place: 'SIMC' });
    yield say('', 'Each side tells her things it has not told the other.');
    yield say('', 'Some she [may carry across]. Some <stay in the room>.');
    yield free({ need: ['hendra', 'ncounsel', 'bdir', 'bcounsel'], goals: { hendra: 'ASK PAK HENDRA WHAT HE NEEDS', ncounsel: 'ASK WHAT SHE MAY CARRY ACROSS', bdir: 'CROSS TO BALTIC\'S ROOM', bcounsel: 'ASK WHAT SHE MAY CARRY ACROSS' } });
    yield* gap();
  }

  // ================================================================ the answers: an end roll, a few pages for each question in the memo
  // Every line is taken from Part II of the memo. part is the answer it belongs to, checked against the memo filed on 12 October 2026.
  // The engine lays each page out (G.roll): the picture from draw, the question in brackets, the claim, then the reasons.
  function ship(x, y) { r(x, y + 6, 24, 6, '1'); r(x + 16, y, 6, 6, 'w'); box(x + 15, y - 1, 8, 8, 'k'); r(x + 2, y + 2, 5, 4, 'L'); r(x + 8, y + 2, 5, 4, 'C'); r(x, y + 12, 24, 1, 'k'); }
  function sheets(x, y, n) { for (var i = 0; i < n; i++) { r(x, y - i * 2, 12, 2, 'w'); box(x - 1, y - 1 - i * 2, 14, 4, '3'); } }
  function talk(t, xa, xb, y) { if (((t * 1.1) | 0) % 2) K.chat(xa, y, 14, 'L'); else K.chat(xb, y, 14, 'C'); }
  var Q1 = 'WHICH LAYER OF CULTURE SHAPES THE BLAME?', Q2 = 'NEED ENFORCEMENT? WOULD A HYBRID HELP?', Q3 = 'HOW TO MANAGE MUTUAL DEPENDENCE?', Q4 = 'OPERATIONAL TEAMS OR COUNSEL?';
  var ROLL = [
    { part: 1, q: Q1, head: 'Russia is direct. Indonesia avoids confrontation.',
      body: ['Those are Meyer\'s scales. Both are hierarchical and build trust through relationships.', 'Dmitri and Rizky worked well together until Legal took over and the letters began.'],
      draw: function (t, y) {
        r(8, y, 88, 34, '6'); r(96, y, 88, 34, 'E'); txt('UNTIL MARCH', 52, y + 2, '2', { a: 'c' }); txt('AFTER MARCH', 140, y + 2, '2', { a: 'c' });
        K.fig('dmitri', 34, y + 33, { dir: 'r' }); K.fig('rizky', 70, y + 33, { dir: 'l' }); talk(t, 38, 52, y + 9);
        K.fig('dmitri', 110, y + 33, { dir: 'r' }); K.fig('legal', 140, y + 33, {}); sheets(150, y + 31, 4); K.fig('rizky', 174, y + 33, { dir: 'l' }); K.env(118 + Math.round(((t * 0.4) % 1) * 40), y + 10, 'X');
      } },
    { part: 1, q: Q1, head: 'The same letter is read two ways.',
      body: ['Baltic prefers everything on paper first. Russian procedure requires a claim letter before most suits.', 'Nusantara reads it as an accusation of bad faith. In Indonesia, fault is admitted in private.'],
      draw: function (t, y) {
        r(8, y, 88, 34, 'E'); r(96, y, 88, 34, 'J'); var f = (t * 0.45) % 1;
        K.fig('legal', 20, y + 33, { dir: 'r' }); sheets(30, y + 31, 9); K.sign(58, y + 3, 'A ROUTINE CLAIM', 'b', 'w');
        K.fig('hendra', 172, y + 33, { dir: 'l' }); sheets(146, y + 31, 2); K.sign(138, y + 3, 'AN ACCUSATION', 'c', 'w');
        K.env(46 + Math.round(f * 28), y + 20, 'X'); K.letter(86, y + 13, 20, 20, { acc: 'b' }); r(96, y + 15, 8, 2, 'c');
      } },
    { part: 1, q: Q1, head: 'Each expects the response the other is least likely to give.',
      body: ['Baltic wants a written reply, point by point, inside a deadline.', 'Nusantara wants a phone call, a visit, or the letter withdrawn.'],
      draw: function (t, y) {
        r(8, y, 88, 34, 'E'); r(96, y, 88, 34, 'J'); K.sign(52, y + 3, 'A WRITTEN REPLY', 'b', 'w'); K.sign(140, y + 3, 'A CALL OR A VISIT', 'c', 'w');
        K.fig('legal', 22, y + 33, { dir: 'r' }); K.letter(36, y + 15, 16, 17, { acc: 'b' }); K.clock(70, y + 23, 7, 3, (t * 20) % 60);
        K.fig('hendra', 170, y + 33, { dir: 'l', armL: 'up' }); K.phone(158, y + 12, 'e'); K.chat(124, y + 17, 16, 'C');
      } },
    { part: 2, q: Q2, head: 'The point of the dispute is an exchange of value.',
      body: ['Consignment 5 against the withheld price: sequenced, or through escrow.', 'The next three years police themselves: each side needs the other.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); var f = K.ease(0.1, 0.9, (t * 0.35) % 1.3);
        txt('ESCROW', 96, y + 2, '2', { a: 'c' }); dash(78, y + 9, 114, y + 9, '2', 2, 2); dash(78, y + 31, 114, y + 31, '2', 2, 2); dash(78, y + 9, 78, y + 31, '2', 2, 2); dash(114, y + 9, 114, y + 31, '2', 2, 2);
        K.sign(28, y + 3, 'BALTIC', 'b', 'w'); K.sign(160, y + 3, 'NUSANTARA', 'c', 'w'); K.crate5(16 + Math.round(f * 46), y + 15, 16, 14, '5'); K.coins(166 - Math.round(f * 46), y + 27, 3);
      } },
    { part: 2, q: Q2, head: 'Only the past money terms need enforcing.',
      body: ['And only if one side later defaults.', 'A bare settlement is weak: assets in Russia and Indonesia, neither state in the Singapore Convention.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); K.sign(46, y + 3, 'ASSETS IN RUSSIA', 'b', 'w'); K.sign(142, y + 3, 'ASSETS IN INDONESIA', 'c', 'w');
        K.letter(88, y + 14, 16, 18, { acc: 'k' }); dash(48, y + 14, 86, y + 22, '3', 2, 2); dash(106, y + 22, 142, y + 14, '3', 2, 2); K.cross(64, y + 15, 'X'); K.cross(122, y + 15, 'X');
        txt('A BARE SETTLEMENT', 44, y + 26, '2', { a: 'c' }); txt('IS ONLY A CONTRACT', 146, y + 26, '2', { a: 'c' });
      } },
    { part: 2, q: Q2, head: 'A hybrid would help: Arb-Med-Arb.',
      body: ['Both opt in and file jointly: a consent award.', 'Both countries must enforce it under the New York Convention.', 'It carries only the money terms.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); var k = ((t * 0.9) | 0) % 4;
        [['FILE JOINTLY', 38], ['MEDIATE', 96], ['CONSENT AWARD', 150]].forEach(function (q, i) { K.sign(q[1], y + 3, q[0], i <= k ? 'k' : '4', 'w'); });
        K.arrow(68, y + 7, 76, y + 7, 'k'); K.arrow(116, y + 7, 118, y + 7, 'k');
        K.letter(22, y + 15, 14, 17, { acc: 'k' }); K.seal(31, y + 27, 'C'); txt('NEW YORK CONVENTION', 104, y + 16, '2', { a: 'c' });
        K.check(58, y + 25, 'b'); txt('RUSSIA', 66, y + 25, 'b'); K.check(108, y + 25, 'c'); txt('INDONESIA', 116, y + 25, 'c');
      } },
    { part: 3, q: Q3, head: 'An interest-based process.',
      body: ['It shares causation rather than ruling on fault.', 'It starts from each side\'s worst alternative to agreement (WATNA).', 'Facilitative in joint session, more evaluative in private.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); K.fig('bdir', 26, y + 33, { dir: 'r' }); K.fig('mediator', 62, y + 33, { dir: 'r' }); K.fig('hendra', 98, y + 33, { dir: 'r' });
        K.cal(140, y + 5, '20 OCT', '2026', 'X'); txt('THE CAP', 118, y + 6, 'X', { a: 'c' }); K.bar(104, y + 16, 28, 4, 0.78 + 0.04 * Math.sin(t), 'X', 'w');
      } },
    { part: 3, q: Q3, head: 'First, the next ten days.',
      body: ['Consignment 5 ships against part payment. Baltic\'s engineers go to site.', 'Both sign a single request to Tirta Water for more time.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); var f = (t * 0.3) % 1; r(8, y + 27, 70, 7, 'Q'); r(8, y + 27, 70, 1, 'u'); ship(12 + Math.round(f * 40), y + 15); K.coins(92, y + 30, 2);
        K.fig('docker', 112, y + 33, { dir: 'r' }); K.fig('docker', 126, y + 33, { dir: 'r', walk: ((t * 4) | 0) % 2 });
        K.sign(160, y + 3, 'TIRTA WATER', 'v', 'w'); K.env(136 + Math.round(f * 16), y + 18, '2'); K.sign(40, y + 3, 'CONSIGNMENT 5', 'b', 'w');
      } },
    { part: 3, q: Q3, head: 'Then the past, then the future.',
      body: ['Four past consignments: split shared causes under Clause 10.3, or waive.', 'Three more years: a joint shipment record. Call first, confirm in writing.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); K.sign(50, y + 3, '4 PAST', 'k', 'w'); K.sign(142, y + 3, '3 YEARS', 'k', 'w');
        r(26, y + 19, 24, 7, 'b'); r(50, y + 19, 24, 7, 'c'); box(25, y + 18, 50, 9, 'k'); r(49, y + 15, 2, 15, 'k'); txt('TO THE EXTENT', 50, y + 28, '2', { a: 'c' });
        K.paper(118, y + 14, 14, 17, { head: 'b' }); r(125, y + 15, 6, 2, 'c'); K.phone(142, y + 16, 'e'); K.arrow(152, y + 21, 160, y + 21, 'k'); K.letter(164, y + 15, 12, 14, { acc: 'k' });
      } },
    { part: 3, q: Q3, head: 'The penalties are the smaller sum.',
      body: ['About USD 160,000 is in dispute.', 'Tirta Water\'s charge grows by that much every eleven days.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); txt('PENALTIES IN DISPUTE', 12, y + 2, '2'); r(12, y + 9, 26, 5, 'b'); r(38, y + 9, 8, 5, 'c'); box(11, y + 8, 36, 7, 'k'); txt('ABOUT USD 160,000', 52, y + 9, 'k');
        txt('TIRTA WATER\'S CHARGE', 12, y + 18, '2'); var f = 0.78 + 0.045 * ((t * 0.25) % 1); r(12, y + 25, 160, 5, 'w'); r(12, y + 25, Math.round(160 * f), 5, 'X'); box(11, y + 24, 162, 7, 'k'); txt('CAP USD 750,000', 180, y + 18, 'X', { a: 'r' });
      } },
    { part: 4, q: Q4, head: 'It cannot be one or the other.',
      body: ['Counsel handle rights. The operational teams handle facts and future cooperation.', 'Run only by counsel, it would repeat the deadlock. Run only by operations, it would leave rights unprotected.'],
      draw: function (t, y) {
        r(8, y, 88, 34, '5'); r(96, y, 88, 34, '6'); K.sign(52, y + 3, 'COUNSEL: RIGHTS', 'k', 'w'); K.sign(140, y + 3, 'OPERATIONS: FACTS', 'k', 'w');
        K.fig('bcounsel', 34, y + 33, { dir: 'r' }); K.paper(44, y + 17, 9, 11, { edge: 'b' }); K.fig('ncounsel', 72, y + 33, { dir: 'l' }); K.paper(56, y + 17, 9, 11, { edge: 'c' });
        K.fig('dmitri', 122, y + 33, { dir: 'r' }); K.fig('rizky', 158, y + 33, { dir: 'l' }); K.crate5(134, y + 21, 12, 12, null);
      } },
    { part: 4, q: Q4, head: 'Counsel has to be in the room.',
      body: ['A statement about cause is an admission under Clause 10.3.', 'Arbitration reopens on 31 October. In April nobody at operational level had authority over money.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); K.letter(18, y + 4, 44, 27, { acc: 'k', head: 'CLAUSE 10.3' }); K.cal(74, y + 5, '31 OCT', '2026', 'k');
        K.fig('bcounsel', 136, y + 33, { dir: 'l' }); K.fig('ncounsel', 164, y + 33, { dir: 'l' }); K.sign(150, y + 3, 'COUNSEL', 'k', 'w');
      } },
    { part: 4, q: Q4, head: 'Let Dmitri and Rizky talk.',
      body: ['They know what happened at the port, and they will run the next three years.', 'A working session with the mediator, without their superiors: confidential and without prejudice.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); r(8, y + 29, 176, 5, '5'); K.sign(96, y + 3, 'WITHOUT PREJUDICE', 'k', 'w');
        K.fig('dmitri', 70, y + 33, { dir: 'r' }); K.fig('mediator', 96, y + 31, {}); K.fig('rizky', 122, y + 33, { dir: 'l' }); K.desk(82, y + 20, 28); talk(t, 44, 132, y + 12);
        K.paper(150, y + 14, 14, 17, { head: 'b' }); r(157, y + 15, 6, 2, 'c');
      } },
    { part: 5, q: 'WHERE IT STANDS ON 13 OCTOBER', hud: { date: '13 OCTOBER 2026', meter: CHARGE.oct13 }, head: 'The mediation resumes. Seven days to the cap.',
      body: ['Still open: the General Director\'s approval, Tirta Water\'s deadline, the March notices.'],
      draw: function (t, y) {
        r(8, y, 176, 34, 'K'); K.crate5(66, y + 11, 22, 20, null); r(68, y + 13, 9, 10, 'w'); txt('5', 72, y + 14, 'k', { a: 'c', f: 'big' }); K.safe(106, y + 11, 22, 18, false); r(107, y + 12, 20, 2, 'c');
        for (var i = 62; i <= 132; i++) r(i, y + 24, 1, 2, ((i + ((t * 2) | 0)) & 3) < 2 ? 'w' : 'U'); K.padlock(92, y + 17, '3');
        K.key(12, y + 9 + K.bob(t, 0, 1), 4); K.cal(140, y + 6, '20 OCT', '2026', 'X');
      } },
    { part: 6, q: 'GROUP 7', hud: { date: '', meter: null }, head: 'Baltic v Nusantara: the mediation',
      body: ['International Dispute Resolution, October 2026.', 'An illustrative reconstruction. Names, dates, figures and clause wording are fictional.'],
      draw: function (t, y) {
        for (var j = 0; j < 14; j++) r(8, y + j, 176, 1, j < 5 ? 'G' : j < 10 ? 'I' : 'J'); r(8, y + 14, 176, 20, 'Q'); r(8, y + 14, 176, 1, 'u');
        for (var i = 0; i < 12; i++) r(12 + ((i * 17 + ((t * 3) | 0)) % 166), y + 19 + (i % 4) * 4, 3, 1, 'u');
        ship(16 + ((t * 5) % 136), y + 4); K.sign(28, y + 3, 'BALTIC', 'b', 'w'); K.sign(160, y + 3, 'NUSANTARA', 'c', 'w');
      } }
  ];
  function* act4() {
    if (!S.sub) yield* G.card({ kicker: 'THE ANSWERS', title: 'FOUR QUESTIONS', sub: 'THE ADJOURNMENT, 9 TO 13 OCTOBER 2026', note: 'FROM HERE ON: WHAT GROUP 7 PROPOSES. NONE OF IT HAS HAPPENED.', acc: 'l', plain: 'The adjournment, 9 to 13 October 2026. From here on: what Group 7 proposes. None of it has happened.' });
    yield* G.roll(ROLL, { part: S.sub, hud: { date: 'GROUP 7 PROPOSES', place: '', meter: CHARGE.oct9 } });
  }
  G.story({
    drawTitle: drawTitle,
    acts: [
      { menu: '1 THE DELAY', heading: 'Act 1: the delay', run: act1 },
      { menu: '2 WHY MEDIATE', heading: 'Act 2: why mediate', run: act2 },
      { menu: '3 THE MEDIATION', heading: 'Act 3: the mediation', run: act3 },
      { menu: '4 THE ANSWERS', heading: 'The answers: what Group 7 proposes', run: act4, sub: { title: 'THE ANSWERS', link: 'answer', opts: ['FROM THE START', '1 CULTURE', '2 ENFORCEMENT', '3 APPROACH', '4 WHO DOES IT'] } }
    ]
  });
  G.ROLL = ROLL; G.bag = bag;                                                                                          // for this story's own checks (checks.js)
})();
