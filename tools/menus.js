/* menus.js: checks what every story gets from the engine, without a browser: the title menu, the PLAY ALONG card,
   the pause menu, the chapter list, links to chapters, auto play, the pointer, the end roll's page turning,
   and the return to the title when the story ends.
   node tools/menus.js stories/starter */
const lib = require('./lib.js'), T = lib.harness(lib.storyArg()), { G, S, PX, ok, skip, run, until } = T;
const acts = G.acts(), PY = G.HUD + G.SH, TS = PX.kit.TS;
const isTitle = () => !!(S.menu && S.menu.id === 'title');
const nextNeed = W => { for (const id of W.need) if (!W.done[id]) return W.byId[id]; return null; };

// ---------------------------------------------------------------- the title menu
G.start(); run(30);
ok('the title menu is up', isTitle() && S.menu.opts[0] === 'START' && S.menu.opts[1] === 'CHAPTERS');
const q = G.qrCode();
if (q) {
  const at = T.option('PLAY ALONG'); G.pick(at); run(40);
  ok('PLAY ALONG shows the code', S.mode === 'custom' && S.custom && S.custom.tall && !S.menu);
  const L = G.playAlongLayout(), f = G.draw(); let wrong = 0;
  for (let j = 0; j < q.n; j++) for (let i = 0; i < q.n; i++) { const x = 6 + (L.pad + i) * L.s, y = G.HUD + 5 + (L.pad + j) * L.s; if ((f[y * G.FW + x] === PX.C.k) !== (q.rows[j][i] === '1')) wrong++; }
  ok(`every module of the code is on the card (version ${q.version}, ${q.n} modules a side, ${L.s} pixels each)`, wrong === 0);
  ok('the card fits the screen', 4 + L.size + 2 <= L.ay - 2 && L.ay + L.lines.length * L.lh <= G.SH + G.PAN);
  G.tap('a'); run(40); ok('Enter returns to the title menu, cursor on PLAY ALONG', isTitle() && S.menu.sel === at);
} else ok('the story has no link, so the menu has no PLAY ALONG', T.option('PLAY ALONG') < 0);
G.cycleAuto(); run(3); ok('the title menu follows the auto key', isTitle() && S.menu.opts[T.option('AUTO')] === 'AUTO: MOVES'); S.auto = 0; run(3);
G.tap('start'); run(5); ok('Esc on the title does nothing', isTitle() && !S.pauseRun);
G.point(120, PY + 12); run(5); ok('a tap on CHAPTERS opens the list of acts', !!S.menu && S.menu.id === 'chapters' && S.menu.opts.length === acts.length);
G.down('b'); G.up('b'); run(5); ok('B closes it', isTitle());

// ---------------------------------------------------------------- chapters, and links to them
acts.forEach((a, i) => {
  G.start(); run(30); G.pick(T.option('CHAPTERS')); run(5);
  const row = S.menu && S.menu.box ? G.HUD + S.menu.box.y + 3 + 11 * i + 5 : 0; if (S.menu && S.menu.box) G.point(S.menu.box.x + 20, row); run(5);
  if (a.sub) {
    const partsUp = !!S.menu && S.menu.id === 'parts' && S.menu.opts.length === a.sub.opts.length, last = a.sub.opts.length - 1;
    G.pick(last); run(5);
    ok(`chapter ${i + 1} offers its ${a.sub.opts.length} parts and opens at the last one`, partsUp && S.act === i && S.sub === last);
  } else ok(`a tap on chapter ${i + 1} in the list opens it`, S.act === i);
  const h = G.fromHash('#act-' + (i + 1)); ok(`the link #act-${i + 1} opens chapter ${i + 1}`, !!h && h[0] === i && h[1] === 0);
  if (a.sub && a.sub.link) { const k = G.fromHash('#' + a.sub.link + '-1'); ok(`the link #${a.sub.link}-1 opens its first part`, !!k && k[0] === i && k[1] === 1); }
});
ok('a link to a chapter that does not exist opens the title', G.fromHash('#act-' + (acts.length + 1)) === null && G.fromHash('#nothing') === null);

// ---------------------------------------------------------------- the pause menu
G.start(); run(30); G.pick(0);
ok('START begins the first act', until(() => S.act === 0 && !S.trans && (S.text || S.menu || S.mode === 'card' || (S.world && S.world.free)), 600));
let said = 0; const say0 = G.hooks.say; G.hooks.say = function () { said++; return say0.apply(this, arguments); };
G.tap('start'); run(5); ok('Esc pauses', !!S.pauseRun && !!S.menu && S.menu.id === 'pause');
const hero0 = S.world ? S.world.hero.c + ',' + S.world.hero.r : ''; said = 0;
G.down('left'); run(45); G.up('left');
ok('the story stands still while paused', said === 0 && (S.world ? S.world.hero.c + ',' + S.world.hero.r : '') === hero0);
G.pick(2); run(5); ok('sound toggles off', S.sound === false && S.menu.opts[2] === 'SOUND: OFF'); G.pick(2); run(5); ok('and on again', S.sound === true);
G.pick(3); run(5); ok('auto play cycles to moves and the cursor stays on it', S.auto === 1 && S.menu.opts[3] === 'AUTO: MOVES' && S.menu.sel === 3);
G.pick(3); run(5); ok('then to full', S.auto === 2); G.pick(3); run(5); ok('then off', S.auto === 0);
G.pick(0); run(5); ok('RESUME returns to the story', !S.pauseRun && S.act === 0);
G.tap('start'); run(5); G.pick(1); run(5); ok('CHAPTERS opens from the pause menu', !!S.menu && S.menu.id === 'chapters');
G.down('b'); G.up('b'); run(5); G.pick(4); run(40); ok('TITLE SCREEN returns to the title', isTitle() && S.act === -1);

// ---------------------------------------------------------------- the first room: the pointer and auto play
G.start(0);
const inRoom = () => !!(S.world && S.world.free && !S.world.sub && !S.text), plays0 = S.plays;
if (until(() => inRoom() || S.plays > plays0, 40000, 'next') && inRoom()) {
  let W = S.world, it = nextNeed(W);
  if (it) {
    if (it.who) G.point(it.x, G.HUD + it.y - 8); else G.point(it.c * TS + it.w * TS / 2, G.HUD + it.yb - 6);
    ok('a tap on what the room asks for walks there and starts it', until(() => S.world === W && (W.sub || W.done[it.id]), 600));
    until(() => S.world !== W || (!W.sub && !S.text), 4000, 'a');
  } else skip('the first room asks for nothing, so there is nothing to tap');
  if (S.world === W && W.free && nextNeed(W)) {
    S.auto = 1; const c0 = W.hero.c, r0 = W.hero.r, d0 = Object.keys(W.done).length;
    ok('auto play walks to the next goal with no key pressed', until(() => W.sub || S.text || Object.keys(W.done).length > d0 || W.hero.c !== c0 || W.hero.r !== r0, 300)); S.auto = 0;
  } else skip('the first room has one goal, so auto play has nowhere left to walk');
} else skip('the story has no room to walk in');

// ---------------------------------------------------------------- the end roll, then the end
G.start(0);
const rollUp = () => !!(S.roll && S.roll.full && S.roll.from < 0 && S.roll.page >= 1), plays1 = S.plays;
if (until(() => rollUp() || S.plays > plays1, 60000, 'next') && rollUp()) {
  const pg = S.roll.page; G.down('left'); G.up('left');
  ok('in the end roll, left goes back a page', until(() => S.roll && S.roll.page === pg - 1 && S.roll.full, 200));
} else skip('the story has no end roll of two pages or more');
ok('when the story ends the game returns to the title', until(() => S.act === -1 && isTitle(), 60000, 'next') && S.plays > plays1);
T.done('menu and pointer checks');
