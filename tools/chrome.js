/* chrome.js: opens a built page in a real headless Chrome and plays the opening with real key presses, on the page's own clock.
   The other tools run the game without a browser; this one checks the page around it: keys, buttons, sizes, errors.

   It needs puppeteer-core, which this repository does not ship. Point NODE_PATH at a folder that holds it:
     NODE_PATH=/path/to/node_modules node tools/chrome.js dist/starter.html [folder for screenshots]
   Chrome is looked for in the usual place on a Mac. Set CHROME to its path if yours is elsewhere. */
const puppeteer = require('puppeteer-core'), path = require('path'), fs = require('fs');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  const [file, shots] = process.argv.slice(2), errors = []; let bad = 0;
  if (!file) { console.error('give a built page, for example dist/starter.html'); process.exit(2); }
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const ok = (name, v, more) => { console.log((v ? 'ok   ' : 'FAIL ') + name + (more ? ': ' + more : '')); if (!v) bad++; };
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push('page error: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(file));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const st = () => page.evaluate(() => { const G = GAME.G, S = G.S, c = document.getElementById('screen'); return { time: S.time, mode: S.mode, act: S.act, auto: S.auto, menu: S.menu && S.menu.title, id: S.menu && S.menu.id, opts: S.menu && S.menu.opts, sel: S.menu && S.menu.sel, text: S.text && S.text.lines.join(' '), tall: !!(S.custom && S.custom.tall), hero: S.world && [S.world.hero.c, S.world.hero.r], canvas: [c.clientWidth, c.clientHeight], docW: document.documentElement.scrollWidth, live: document.getElementById('live').textContent, title: document.title, link: G.link(), acts: G.acts().length }; });
  const shot = async name => { if (!shots) return; const el = await page.$('#screen'); await el.screenshot({ path: path.join(shots, name + '.png') }); };

  await sleep(1500); let s = await st();
  ok('the page loads and its clock runs', s.time > 0.5, `"${s.title}", ${s.acts} act(s)`);
  ok('the title menu is up', s.id === 'title', (s.opts || []).join(' | '));
  ok('the screen is drawn in whole pixels', s.canvas[0] % 192 === 0 && s.canvas[1] % 150 === 0, s.canvas.join(' by '));
  ok('the page is no wider than the window', s.docW <= 1440, s.docW + ' of 1440');
  ok('the menu is announced for screen readers', /Choose/.test(s.live), JSON.stringify(s.live.slice(0, 60)));
  await shot('1-title');
  if (s.link) {
    const k = s.opts.indexOf('PLAY ALONG'); await page.keyboard.press(String(k + 1)); await sleep(1500); s = await st();
    ok('the key ' + (k + 1) + ' opens the PLAY ALONG card', s.tall && !s.menu); await shot('2-play-along');
    await page.keyboard.press('Enter'); await sleep(1200); s = await st(); ok('Enter returns to the title', s.id === 'title');
  }
  await page.keyboard.press('t'); await sleep(300); s = await st(); const label = await page.$eval('#b-auto', b => b.textContent);
  ok('the T key switches auto play and the button under the screen follows', s.auto === 1 && /moves/.test(label), label);
  await page.keyboard.press('t'); await page.keyboard.press('t'); await sleep(200);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowLeft'); await sleep(200);                    // the cursor back to START, wherever it was
  await page.keyboard.press('ArrowRight'); await sleep(200); s = await st(); ok('the arrow keys move the cursor in the menu', s.sel === 1);
  await page.keyboard.press('ArrowLeft'); await sleep(200); await page.keyboard.press('Enter'); await sleep(1500); s = await st();
  ok('Enter on START begins act 1', s.act === 0, 'mode ' + s.mode);
  let seen = new Set(), lines = 0, last = '';
  for (let i = 0; i < 40; i++) { await page.keyboard.press('n'); await sleep(300); s = await st(); seen.add(s.mode); if (s.text && s.text !== last) { last = s.text; lines++; } if (s.menu && s.id === '') break; }
  ok('N plays the record forward', lines >= 2, `${lines} lines read, through ${[...seen].join(', ')}` + (s.menu ? `, to the choice "${s.menu}"` : ''));
  await shot('3-in-play');
  await page.keyboard.press('Escape'); await sleep(400); s = await st(); ok('Esc opens the pause menu', s.id === 'pause');
  await page.keyboard.press('Enter'); await sleep(300); s = await st(); ok('Enter on RESUME returns to the story', s.id !== 'pause' && s.act === 0);
  // a phone: the page loads again at phone size, and everything is done by touch
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await page.reload(); await sleep(1800); s = await st();
  ok('at phone width the page does not scroll sideways', s.docW <= 390 && s.id === 'title', s.docW + ' of 390, screen ' + s.canvas.join(' by '));
  const box = await (await page.$('#screen')).boundingBox(), k = box.width / 192;
  await page.touchscreen.tap(box.x + 40 * k, box.y + 128 * k); await sleep(1500); ok('a tap on START on the screen begins act 1', (await st()).act === 0);
  const m = await page.$('[data-tap="start"]'); await m.tap(); await sleep(400); ok('a tap on the Menu button under the screen pauses', (await st()).id === 'pause');
  const a = await page.$('.ab .a'); await a.tap(); await sleep(400); s = await st(); ok('a tap on the A button resumes', s.id !== 'pause' && s.act === 0);
  await shot('4-phone');
  ok('no page errors', errors.length === 0, errors.join(' ; '));
  await browser.close(); console.log(bad ? bad + ' failed' : 'all browser checks pass'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('the browser run failed: ' + e.message); process.exit(1); });
