/* checks.js: checks that belong to this story and to no other. The builder runs this file after the engine's own checks.
   It uses the same small harness as tools/menus.js: press buttons, let time pass, look at the state.
   node stories/baltic-nusantara/checks.js */
const T = require('../../tools/lib.js').harness(__dirname), { G, S, ok, run, until } = T;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// the end roll and its four parts
G.start(); run(30); G.pick(T.option('CHAPTERS')); run(5); G.pick(3); run(5);
ok('the answers offer their parts', !!S.menu && S.menu.title === 'THE ANSWERS' && S.menu.opts.length === 5);
G.pick(3); run(5);
ok('a jump lands on the first page of answer 3', S.act === 3 && until(() => S.roll && S.roll.part === 3 && S.roll.full, 600));
const pg = S.roll.page; G.down('left'); G.up('left');
ok('left goes back a page', until(() => S.roll && S.roll.page === pg - 1 && S.roll.full, 200));
ok('the roll has fifteen pages', G.ROLL.length === 15 && S.roll.pages === 15);
ok('the proposal pages carry the charge of 9 October', S.hud.meter === 585000 && S.hud.date === 'GROUP 7 PROPOSES' && G.cfg().meter.text(S.hud.meter) === 'USD 585,000');
ok('the 13 October page carries that day\'s charge', until(() => S.roll && S.roll.part === 5 && S.roll.full, 4000, 'next') && S.hud.meter === 645000 && S.hud.date === '13 OCTOBER 2026');
ok('the last page shows no charge', until(() => S.roll && S.roll.part === 6 && S.roll.full, 600, 'next') && S.hud.meter === null && S.hud.date === '');
ok('then the game returns to the title', until(() => S.act === -1 && S.menu && S.menu.id === 'title', 3000, 'next'));
const h = G.fromHash('#answer-2'); ok('the link #answer-2 opens the second answer', same(h, [3, 2]));

// act 2: a way out that is shut gets the memo's reason, and the menu comes back
G.start(1);
ok('a way out that is shut gets its reason', until(() => S.menu && S.menu.title === 'WHAT NOW', 900, 'a') && (G.pick(0), until(() => /SIAC award/.test(T.text()), 300)) && until(() => S.menu && S.menu.title === 'WHAT NOW', 300, 'a'));
ok('the charge reaches USD 225,000 on 15 September', until(() => S.hud.date === '15 SEPTEMBER 2026' && S.hud.meter === 225000, 3000, 'next'));

// act 3: the pointer in the joint session, then the bag in the two private rooms
G.start(2);
ok('walking by pointer: tap Pak Hendra', until(() => S.world && S.world.free && !S.text, 600, 'next') && (G.point(12 * 12 + 6, G.HUD + 36 + 12 + 4), until(() => /without notes/.test(T.text()), 400)));
ok('the private rooms fill the bag', until(() => S.mode === 'custom' && /Neither delegation/.test(T.text()), 20000, 'next'));
ok('she may carry two things to Baltic', same(G.bag.nb, ['PART PAYMENT', 'MARCH NOTICES']));
ok('and two things to Nusantara', same(G.bag.bn, ['CONSIGNMENT 5', 'JOINT RECORD']));
ok('three things stay in Nusantara\'s room', same(G.bag.ns, ['BROKER ERROR', 'TENDER BAR', 'CASH']));
ok('three things stay in Baltic\'s room', same(G.bag.bs, ['QUARTER END', 'ROUTE', 'FEW OPTIONS']));
T.done('checks of this story');
