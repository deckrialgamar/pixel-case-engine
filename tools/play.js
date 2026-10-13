/* play.js: plays a story without a browser and checks it on the way.

   node tools/play.js stories/starter                 the route on the record (every step is the N key)
   node tools/play.js stories/starter --all           every check the builder runs: the record, four random routes,
                                                      both auto play levels, every chapter and every part of a chapter
   Options for one route: --random --seed=3   random menu choices
                          --auto=1 or --auto=2 auto play: 1 presses only Enter, 2 presses nothing after START
                          --act=2 --sub=1     start from a chapter (acts count from 0 here) and one of its parts
                          --fast              skip the waits
   --out=dir   also write contact sheets (sheet-01.png ...), transcript.json and meta.json to dir
   --pick="WORDS|MORE WORDS"   with --out: one sheet, pick.png, of the frames whose note contains each phrase

   Every route must reach the end. On the way: no line longer than the text box allows, no option too wide for its menu,
   no character the font lacks, no text off the edge of the screen, no unpainted pixel, no colour outside the palette. */
const fs = require('fs'), path = require('path'), T = require('./lib.js'), arg = T.arg;

const told = new Set();
function report(R, what) {
  const says = R.log.filter(q => q.t === 'say').length, menus = R.log.filter(q => q.t === 'menu').length, fresh = R.problems.filter(q => !told.has(q));
  console.log(`${what}: ${says} lines, ${menus} menus, ${R.frames.length} frames checked, ${R.time.toFixed(0)} s of play` + (R.problems.length ? (fresh.length ? '' : ', the same problems again') : ', no problems'));
  fresh.forEach(q => { told.add(q); console.log('  ' + q); });      // a problem is printed once, however many routes meet it
  return R.problems.length;
}

function main() {
  const dir = T.storyArg(), out = arg('out');
  let bad = 0, R;
  if (arg('all')) {
    R = T.run(dir, {}); bad += report(R, 'the record');
    const M = T.meta(R.L);
    if (M.config.link && !M.qr) { console.log('  LINK too long for a QR code (213 characters at most): ' + M.config.link); bad++; }
    if (M.qr) for (const ch of M.linkText) if (!R.PX.has(ch, 'big') || !R.PX.has(ch, 'small')) { console.log(`  LINK the font has no "${ch}": set linkText in config.js to the address as it should be written on the PLAY ALONG card`); bad++; break; }
    if (M.qr && R.G.playAlongLayout().s < 2) console.log(`  note: the link is ${M.config.link.length} characters long, so the code on the PLAY ALONG card is small. A shorter address scans from further away.`);
    for (const seed of [1, 2, 3, 4]) bad += report(T.run(dir, { random: true, fast: true, seed }), 'random route ' + seed);
    for (const level of [1, 2]) bad += report(T.run(dir, { auto: level }), 'auto play level ' + level + ', no arrow key');
    M.acts.forEach((a, i) => {
      if (i > 0) bad += report(T.run(dir, { fast: true, act: i, sub: 0 }), `chapter ${i + 1} (${a.menu})`);
      if (a.sub) a.sub.opts.forEach((name, k) => { if (k > 0) bad += report(T.run(dir, { fast: true, act: i, sub: k }), `chapter ${i + 1}, part ${k} (${name})`); });
    });
  } else {
    const o = { seed: +(arg('seed') || 0), random: !!arg('random'), every: +(arg('every') || 0), fast: !!arg('fast'), auto: +(arg('auto') || 0) };
    if (arg('act') !== undefined) o.act = +arg('act'); if (arg('sub') !== undefined) o.sub = +arg('sub');
    R = T.run(dir, o); bad += report(R, o.random ? `random route ${o.seed}` : o.auto ? `auto play level ${o.auto}` : 'the record');
  }
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    const per = +(arg('per') || 20), cols = +(arg('cols') || 5), scale = +(arg('scale') || 2);
    if (arg('pick')) {
      const want = String(arg('pick')).split('|'), got = want.map(w => R.frames.find(f => f.note.includes(w) || f.label === w)).filter(Boolean);
      want.forEach(w => { if (!R.frames.find(f => f.note.includes(w) || f.label === w)) console.log('  no frame for', w); });
      T.sheet(got, path.join(out, 'pick.png'), cols, scale, R.G.FW, R.G.FH); console.log('wrote pick.png with', got.length, 'frames');
    } else {
      for (let i = 0; i * per < R.frames.length; i++) T.sheet(R.frames.slice(i * per, (i + 1) * per), path.join(out, `sheet-${String(i + 1).padStart(2, '0')}.png`), cols, scale, R.G.FW, R.G.FH);
      console.log('wrote', Math.ceil(R.frames.length / per), 'contact sheets to', out);
    }
    fs.writeFileSync(path.join(out, 'transcript.json'), JSON.stringify(R.log, null, 1));
    fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(T.meta(R.L), null, 1));
  }
  console.log(bad ? `${told.size || bad} problem${(told.size || bad) > 1 ? 's' : ''} to fix` : 'all routes reach the end with no problems');
  process.exit(bad ? 1 : 0);
}
try { main(); } catch (e) { console.error('the story could not be played: ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n') : e)); process.exit(1); }
