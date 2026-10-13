/* lib.js: what the tools share. It loads the engine and one story without a browser, plays a route through it,
   checks every frame and every line of text on the way, and writes PNG files. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), ENGINE = path.join(ROOT, 'engine');
const ENGINE_FILES = ['engine.js', 'kit.js', 'qr.js', 'game.js'], STORY_FILES = ['config.js', 'art.js', 'story.js'];

function storyFiles(dir) { return STORY_FILES.filter(f => fs.existsSync(path.join(dir, f))); }

// the palette rule: red below blue in every colour. White and the engine's declared reds are the only exceptions.
function paletteProblems(PX) {
  const out = [], accent = new Set(PX.ACCENT);
  for (const k in PX.HEX) {
    const hex = PX.HEX[k]; if (!/^#[0-9a-f]{6}$/i.test(hex)) { out.push(`PALETTE ${k}: "${hex}" is not a colour like #1f5fd6`); continue; }
    const n = parseInt(hex.slice(1), 16), R = n >> 16, B = n & 255;
    if (!accent.has(k) && R >= B && !(R === 255 && B === 255)) out.push(`PALETTE ${k} ${hex} is warm: its red (${R}) is not below its blue (${B})`);
  }
  return out;
}

function load(storyDir) {
  storyDir = path.resolve(storyDir);
  if (!fs.existsSync(path.join(storyDir, 'story.js'))) throw new Error('no story.js in ' + storyDir);
  const ctx = { console, Math, Uint32Array, JSON, module: {} }; vm.createContext(ctx);
  const font = JSON.parse(fs.readFileSync(path.join(ENGINE, 'font.json'), 'utf8'));
  for (const f of ENGINE_FILES) vm.runInContext(fs.readFileSync(path.join(ENGINE, f), 'utf8'), ctx, { filename: path.join('engine', f) });
  const G = vm.runInContext('G', ctx), PX = ctx.PX; G.init(font);
  for (const f of storyFiles(storyDir)) vm.runInContext(fs.readFileSync(path.join(storyDir, f), 'utf8'), ctx, { filename: path.join(path.basename(storyDir), f) });
  const bad = paletteProblems(PX); if (bad.length) throw new Error(bad.join('\n'));
  if (!G.acts().length) throw new Error('the story has no acts: story.js must call G.story({ acts: [...] })');
  return { G, PX, K: PX.kit, QR: ctx.QR, S: G.S, font, ctx, dir: storyDir };
}

function png(w, h, u32) {
  const src = Buffer.from(u32.buffer, u32.byteOffset, u32.byteLength), raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) src.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// a QR matrix as a PNG, s pixels a module with a quiet zone of four modules
function qrPng(q, s) {
  const pad = 4, w = (q.n + 2 * pad) * s, out = new Uint32Array(w * w).fill(0xffffffff);
  for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) if (q.rows[y][x] === '1') for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) out[((y + pad) * s + j) * w + (x + pad) * s + i] = 0xff000000;
  return png(w, w, out);
}

/* Play one route. o.random picks menu options by o.seed; otherwise every step is the move on the record (the N key).
   o.auto 1 presses only Enter, o.auto 2 presses nothing after START. o.act and o.sub start from a chapter. o.fast skips the waits. */
function run(storyDir, o) {
  o = o || {};
  const L = load(storyDir), { G, PX, font } = L, S = G.S, cfg = G.cfg(), limits = Object.assign({ maxLines: 2 }, cfg.checks || {});
  const log = [], frames = [], problems = [], legal = new Set(Object.values(PX.C));
  let rnd = (o.seed || 0) | 0; const rand = n => { rnd = (rnd + 0x6D2B79F5) | 0; let q = Math.imul(rnd ^ (rnd >>> 15), 1 | rnd); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) % n; };
  const has = (f, ch) => ch === ' ' || font[f].glyphs[ch] || font[f].glyphs[ch.toUpperCase()];
  const glyphs = (f, s, where) => { for (const ch of s) if (!has(f, ch)) problems.push(`GLYPH the ${f} font has no "${ch}" (${where} "${s}")`); };
  let pendingSnap = null, sayCount = 0, time = 0, lastCard = null;
  G.hooks.say = (name, text, n, kind) => {
    log.push({ t: 'say', name, text, act: S.act, kind });
    glyphs('big', text, 'in'); glyphs('small', name, 'in the name');
    if (kind === 'card' || kind === 'roll') return;
    sayCount++;
    if (n > limits.maxLines) problems.push(`TEXT ${n} lines, the limit is ${limits.maxLines}: "${text}"`);
    pendingSnap = 'say';
  };
  G.hooks.menu = (title, opts, canon, info) => {
    info = info || {}; log.push({ t: 'menu', title, opts: opts.slice(), canon, act: S.act, id: info.id || undefined }); pendingSnap = 'menu';
    opts.forEach(s => {
      glyphs('small', s, 'in the option');
      if (info.list ? PX.tw(s, 'big') > 160 : PX.tw(s, 'big') > 78 && PX.tw(s, 'small') > 78) problems.push(`MENU option too wide: "${s}"`);
    });
    if (!info.list && opts.length > 4) problems.push(`MENU "${title}" has ${opts.length} options: a menu in the panel holds four`);
    if (info.list && opts.length > 8) problems.push(`MENU "${title}" has ${opts.length} options: a list holds eight`);
    if (canon !== undefined && (canon < 0 || canon >= opts.length)) problems.push(`MENU "${title}": the move on the record (${canon}) is not one of its options`);
    if (title && PX.tw(title) > 170) problems.push(`MENU title too wide: "${title}"`);
  };
  function snap(label) {
    PX.lint = (s, x, y, w, h) => { if (x < 0 || y < 0 || x + w > PX.W || y + h > PX.H) problems.push(`TEXT runs off the screen: "${s}" at ${x},${y} (${label}, act ${S.act + 1})`); };
    const fb = Uint32Array.from(G.draw()); PX.lint = null;
    let holes = 0, alien = 0;
    for (const v of fb) { if (!v) holes++; else if (!legal.has(v)) alien++; }
    if (holes || alien) problems.push(`PIXELS ${label} at ${time.toFixed(1)}s act ${S.act + 1}: ${holes} unpainted, ${alien} off-palette`);
    frames.push({ label, fb, act: S.act, mode: S.mode, note: (S.text ? S.text.lines.join(' ') : '') + (S.menu ? ' MENU ' + S.menu.title : '') + (S.card ? ' CARD ' + S.card.title : '') + (S.roll ? ' ROLL ' + (S.roll.page + 1) : '') + (S.world && S.world.free ? ' GOAL ' + S.objective : '') });
  }
  G.start(o.act, o.sub); S.fast = !!o.fast; S.auto = o.auto || 0;
  let idle = 0, steps = 0, lastKey = '', worldTicks = 0, rollSeen = -1;
  const isTitle = () => S.menu && S.menu.id === 'title';
  for (; steps < 400000; steps++) {
    G.tick(33); time += 0.033;
    if (S.plays > 0) break;
    if (o.act !== undefined && S.act !== o.act && S.act >= 0 && !(S.ended)) { break; }
    const key = S.mode + '|' + (S.text ? S.text.lines.join('/') + S.text.page : '') + '|' + (S.menu ? S.menu.title + S.menu.opts.join(',') : '') + '|' + (S.world ? Object.keys(S.world.done).join(',') + S.world.hero.c + ',' + S.world.hero.r : '') + '|' + (S.card ? S.card.title : '') + '|' + (S.roll ? S.roll.page + ':' + S.roll.scroll : '');
    if (key === lastKey) idle++; else { idle = 0; lastKey = key; }
    if (idle > 900) { problems.push(`STUCK at ${time.toFixed(1)}s act ${S.act + 1}: ${key.slice(0, 120)}`); snap('stuck'); break; }
    if (o.each) o.each(L, frames);
    // auto play: at level 2 nothing is pressed after START; at level 1 only Enter is pressed. No arrow key and no N in either.
    if (o.auto) { if (isTitle()) { if (S.menu.t > 0.3) G.pick(0); } else if (o.auto === 1 && steps % 12 === 0) G.tap('a'); continue; }
    if (S.roll) {
      const c = S.roll; if (c.over) problems.push(`END ROLL page ${c.page + 1} runs past the screen`);
      if (c.full && c.from < 0) { if (rollSeen !== c.page) { rollSeen = c.page; snap('roll'); } if (steps % 8 === 0) G.tap('next'); }
      continue;
    }
    if (S.menu) {
      if (S.menu.t < 0.3) continue;
      if (pendingSnap === 'menu') { snap('menu'); pendingSnap = null; }
      const M = S.menu;
      if (M.id === 'title' || M.id === 'pause') G.pick(0);
      else if (o.random) G.pick(rand(M.opts.length)); else G.tap('next');
      continue;
    }
    if (S.text) { if (S.text.full) { if (pendingSnap === 'say') { if (!o.every || sayCount % o.every === 0) snap('say'); pendingSnap = null; } G.tap('next'); } else if (o.fast || steps % 3 === 0) G.tap('next'); continue; }
    if (S.mode === 'card') { if (S.time - S.card.t0 > 0.9 && S.card !== lastCard) { lastCard = S.card; snap('card'); } if (S.time - S.card.t0 > 0.9) G.tap('next'); continue; }
    if (S.world && S.world.free && !S.world.sub) { if (worldTicks++ % 40 === 0 && !S.world.hero.mv && !(S.world.path && S.world.path.length)) { if (worldTicks === 1 || (worldTicks - 1) % 400 === 0) snap('world'); G.tap('next'); } continue; }
    worldTicks = 0;
  }
  if (steps >= 400000) problems.push('NEVER ENDED');
  return { log, frames, problems: [...new Set(problems)], time, G, PX, L };
}

// frames side by side in one PNG
function sheet(frames, file, cols, scale, FW, FH) {
  const pad = 4, cw = FW * scale, ch = FH * scale, rows = Math.ceil(frames.length / cols), SW = pad + cols * (cw + pad), SH = pad + rows * (ch + pad), out = new Uint32Array(SW * SH).fill(0xff605040);
  frames.forEach((f, i) => { const ox = pad + (i % cols) * (cw + pad), oy = pad + ((i / cols) | 0) * (ch + pad); for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) out[(oy + y) * SW + ox + x] = f.fb[((y / scale) | 0) * FW + ((x / scale) | 0)] || 0xffff00ff; });
  fs.writeFileSync(file, png(SW, SH, out));
}

// what the builder needs to know about a story: its settings (functions left out) and its acts
function meta(L) {
  const G = L.G, cfg = JSON.parse(JSON.stringify(G.cfg())), q = G.qrCode();
  return {
    config: cfg, files: storyFiles(L.dir), linkText: G.linkText(), qr: q ? { version: q.version, modules: q.n } : null,
    acts: G.acts().map(a => ({ menu: a.menu, heading: a.heading || '', sub: a.sub ? { title: a.sub.title, opts: a.sub.opts, link: a.sub.link || '' } : null }))
  };
}

/* A small harness for checks that press buttons and look at the state. A story's own checks.js uses it too:
     const T = require('../../tools/lib.js').harness(__dirname); T.G.start(); T.run(30); T.ok('the title menu is up', T.S.menu); T.done(); */
function harness(storyDir) {
  const L = load(storyDir), { G, S } = L; let bad = 0, n = 0;
  const T = {
    L, G, S, PX: L.PX,
    run(k) { for (let i = 0; i < k; i++) { G.tick(33); G.draw(); } },
    // tick until fn() is true, at most max ticks; press is a button to tap every sixth tick on the way
    until(fn, max, press) { for (let i = 0; i < max; i++) { if (fn()) return true; if (press && i % 6 === 0) G.tap(press); G.tick(33); G.draw(); } return false; },
    ok(name, v) { n++; console.log((v ? 'ok   ' : 'FAIL ') + name); if (!v) bad++; return !!v; },
    skip(name) { console.log('skip ' + name); },
    text() { return S.text ? S.text.lines.join(' ') : ''; },
    option(label) { return S.menu ? S.menu.opts.findIndex(s => s === label || s.indexOf(label + ':') === 0) : -1; },
    done(what) { console.log(bad ? bad + ' of ' + n + ' failed' : 'all ' + n + ' ' + (what || 'checks') + ' pass'); process.exit(bad ? 1 : 0); }
  };
  return T;
}

function arg(k) { const a = process.argv.find(q => q.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : (process.argv.includes('--' + k) ? true : undefined); }
function storyArg() { const a = process.argv.slice(2).find(q => !q.startsWith('--')); if (!a) { console.error('give a story folder, for example stories/starter'); process.exit(2); } return path.resolve(a); }

module.exports = { ROOT, ENGINE, ENGINE_FILES, STORY_FILES, storyFiles, load, run, png, qrPng, sheet, meta, harness, paletteProblems, arg, storyArg };
