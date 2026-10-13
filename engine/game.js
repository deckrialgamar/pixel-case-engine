/* game.js: the runtime. A room to walk in, a text box, a fight screen, an end roll, a title screen, and the runner
   that strings a story's script of them together. It knows nothing about any one story and nothing about the page:
   the page (or a test in node) feeds it buttons and time and takes a 192 by 150 frame back.

   A story plugs in with two calls:
     G.config({ ... })   words and settings (config.js)
     G.story({ ... })    the title picture, the acts and their scripts (story.js)
   docs/STORY-GUIDE.md lists everything a script may call. */
var G = (function () {
  var p = PX.p, r = PX.r, box = PX.box, ln = PX.ln, txt = PX.txt, tw = PX.tw, K = PX.kit;
  var SW = 192, SH = 108, HUD = 10, PAN = 32, FW = SW, FH = HUD + SH + PAN, FY = K.FY, TS = K.TS, COLS = 16, ROWS = 6;
  var last = new Uint32Array(SW * SH), prev = new Uint32Array(SW * SH);
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var DIRS = { up: { k: 'u', dc: 0, dr: -1 }, down: { k: 'd', dc: 0, dr: 1 }, left: { k: 'l', dc: -1, dr: 0 }, right: { k: 'r', dc: 1, dr: 0 } };
  var hooks = { sfx: function () {}, say: function () {}, menu: function () {}, act: function () {} };
  var FONT = null;

  // ---------------------------------------------------------------- what the story sets
  var CFG = { title: '', menuTitle: '', link: '', linkText: '', speakers: {}, meter: null, titleHint: 'A: CHOOSE    N: THE RECORD    ESC: MENU' };
  var NAMECOL = {};
  function config(o) { for (var k in o) CFG[k] = o[k]; if (o.speakers) for (k in o.speakers) NAMECOL[k] = o.speakers[k]; qrCache = null; }
  var acts = [], STORY = {};
  function story(o) { STORY = o || {}; acts = STORY.acts || []; }

  var S = {
    time: 0, mode: 'none', reduced: false, sound: true, auto: 0, act: -1, ended: false,
    hud: { date: '', place: '', meter: null, note: '' }, sub: 0, hint2: '', fast: false, plays: 0, roll: null, vars: {},
    world: null, battle: null, custom: null, card: null, text: null, menu: null,
    objective: '', hint: '', trans: null, wipe: null, shake: 0, flash: 0, pauseRun: null
  };

  // ---------------------------------------------------------------- buttons
  var held = {}, pressed = {}, queue = [], lastDir = null;
  function down(b) { if (!held[b]) queue.push(b); held[b] = true; if (DIRS[b]) lastDir = b; }
  function up(b) { held[b] = false; }
  function tap(b) { queue.push(b); }
  function take(b) { if (pressed[b]) { pressed[b] = false; return true; } return false; }
  function sfx(name) { hooks.sfx(name); }
  // auto play, for a presenter whose arrow keys or pointer fail. 1 (moves): the game walks to each goal and rests the cursor on the record's move,
  // and Enter does the rest. 2 (full): it also picks that move and turns each page after a reading pause. A key press works as before in both.
  var AUTO = ['OFF', 'MOVES', 'FULL'];
  function autoDue(t, chars) { return S.auto === 2 && t > 1.2 + (chars || 0) * 0.045; }
  function cycleAuto() { S.auto = (S.auto + 1) % 3; hooks.sfx('ok'); }

  // ---------------------------------------------------------------- the runner: a script is a generator that yields tasks
  function Runner(gen) { this.gen = gen; this.task = null; this.done = false; this.val = undefined; }
  Runner.prototype.step = function (dt) {
    for (var guard = 0; guard < 400 && !this.done; guard++) {
      if (this.task) { if (this.task.update(dt) !== true) return; this.val = this.task.result; this.task = null; dt = 0; }
      var it = this.gen.next(this.val); this.val = undefined;
      if (it.done) { this.done = true; return; }
      this.task = it.value; if (this.task && this.task.start) this.task.start();
    }
  };

  // ---------------------------------------------------------------- tasks
  function wait(sec, skip) { var t = 0; return { update: function (dt) { t += dt; if (skip && take('a')) return true; return t >= (S.fast ? 0 : sec); } }; }
  function call(fn) { return { update: function () { this.result = fn(); return true; } }; }
  function tween(o, k, to, sec, lin) {
    var t = 0, from;
    return { start: function () { from = o[k]; }, update: function (dt) { t += dt; var f = sec <= 0 || S.fast ? 1 : Math.min(1, t / sec), e = lin ? f : f * f * (3 - 2 * f); o[k] = from + (to - from) * e; return f >= 1; } };
  }
  function par(list) {
    var done = list.map(function () { return false; });
    return {
      start: function () { list.forEach(function (q) { if (q.start) q.start(); }); },
      update: function (dt) { var all = true; list.forEach(function (q, i) { if (!done[i]) done[i] = q.update(dt) === true; if (!done[i]) all = false; }); return all; }
    };
  }
  function wrap(s, maxw, f) {
    var words = String(s).split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (tw(t, f) > maxw && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  // three marks in a line of text: {a side's colour}, [a highlighter] and <red>
  function parseMarks(text, hi) {
    var plain = '', cols = [], cur = null;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '{') { cur = hi || 'b'; continue; } if (ch === '[') { cur = 'M'; continue; } if (ch === '<') { cur = 'X'; continue; }
      if (ch === '}' || ch === ']' || ch === '>') { cur = null; continue; }
      plain += ch; cols.push(cur);
    }
    return { plain: plain, cols: cols };
  }
  function drawMarked(line, off, cols, n, x, y) {
    var i = 0, end = Math.min(n, line.length);
    while (i < end) {
      var c = cols[off + i], j = i; while (j < end && cols[off + j] === c) j++;
      var run = line.slice(i, j), w = tw(run, 'big');
      if (c === 'M') { r(x - 1, y - 1, w + 2, 9, 'o'); txt(run, x, y, 'k', { f: 'big' }); } else txt(run, x, y, c || 'k', { f: 'big' });
      x += w + 1; i = j;
    }
  }
  function say(name, text, o) {
    o = o || {}; var T;
    return {
      start: function () {
        var pm = parseMarks(text, o.hi), lines = wrap(pm.plain, 176, 'big'), offs = [], off = 0;
        lines.forEach(function (l) { offs.push(off); off += l.length + 1; });
        T = S.text = { name: name, col: o.col || NAMECOL[name] || 'k', lines: lines, cols: pm.cols, offs: offs, page: 0, n: 0, full: false, t: 0 }; hooks.say(name, pm.plain, lines.length);
      },
      update: function (dt) {
        var total = T.lines.slice(T.page * 2, T.page * 2 + 2).join('').length; T.t += dt;
        if (!T.full) {
          var before = T.n | 0; T.n += dt * (held.b ? 260 : 64);
          if (S.reduced || S.fast || take('a')) T.n = total;
          if ((T.n | 0) > before && (T.n | 0) % 3 === 0) hooks.sfx('tick');
          if (T.n >= total) { T.n = total; T.full = true; T.t = 0; }
          return false;
        }
        if (take('a') || (held.b && T.t > 0.25) || (o.auto && T.t > o.auto) || S.fast || autoDue(T.t, total)) {
          if ((T.page + 1) * 2 < T.lines.length) { T.page++; T.n = 0; T.full = false; hooks.sfx('next'); return false; }
          S.text = null; hooks.sfx('next'); return true;
        }
        return false;
      }
    };
  }
  // a menu. In the panel it is a two by two grid; with o.list it is a column over the scene. o.canon is the move on the record.
  function menu(title, opts, o) {
    o = o || {}; var M;
    return {
      start: function () { M = S.menu = { id: o.id || '', title: title, opts: opts, sel: o.sel || 0, list: !!o.list, canon: o.canon, pick: -1, t: 0, col: o.col || 'k', y: o.y }; if (S.auto && o.canon !== undefined) M.sel = o.canon; hooks.menu(title, opts, o.canon, { id: M.id, list: M.list }); },
      update: function (dt) {
        M.t += dt; var n = opts.length, s = M.sel;
        for (var q = 0; q < n; q++) { if (opts[q].indexOf('AUTO: ') === 0) opts[q] = 'AUTO: ' + AUTO[S.auto]; else if (opts[q].indexOf('SOUND: ') === 0) opts[q] = 'SOUND: ' + (S.sound ? 'ON' : 'OFF'); }   // a key or a button may change these while the menu is open
        if (M.list) { if (take('up')) s = (s + n - 1) % n; if (take('down')) s = (s + 1) % n; }
        else {
          if (take('left') && s % 2 === 1) s--; if (take('right') && s % 2 === 0 && s + 1 < n) s++;
          if (take('up') && s >= 2) s -= 2; if (take('down') && s + 2 < n) s += 2;
        }
        if (s !== M.sel) { M.sel = s; hooks.sfx('move'); }
        if (take('next')) { if (M.canon !== undefined) M.sel = M.canon; pressed.a = true; }
        if (S.auto === 2 && M.canon !== undefined && M.t > 2.5 + n * 0.7) { M.sel = M.canon; pressed.a = true; }
        if (M.pick >= 0 && M.pick < n) { M.sel = M.pick; M.pick = -1; pressed.a = true; }
        if (take('a')) { this.result = M.sel; S.menu = null; hooks.sfx('ok'); return true; }
        if (o.cancel && take('b')) { this.result = -1; S.menu = null; return true; }
        return false;
      }
    };
  }

  // ---------------------------------------------------------------- the room
  function makeActor(a) {
    return { id: a.id, who: a.who, c: a.c, r: a.r, x: a.c * TS + 6, y: FY + (a.r + 1) * TS - 2, dir: a.dir || 'd', tag: a.tag, col: a.col, on: a.on, walk: 0, mv: null, hidden: !!a.hidden, solid: a.solid !== false, emote: null, armL: a.armL, armR: a.armR, keepDir: a.keepDir, always: a.always };
  }
  function makeWorld(def) {
    var W = { bd: def.bd, over: def.over, panel: def.panel, solid: [], actors: [], objs: [], need: [], done: {}, sub: null, subItem: null, path: null, goal: null, byId: {}, free: false, goals: {} }, i, j;
    for (j = 0; j < ROWS; j++) { W.solid.push([]); for (i = 0; i < COLS; i++) W.solid[j].push(def.map && def.map[j] && def.map[j][i] === '#'); }
    (def.objs || []).forEach(function (o) {
      var ob = { id: o.id, c: o.c, r: o.r, w: o.w || 1, draw: o.draw, on: o.on, tiles: o.tiles, yb: FY + (o.r + 1) * TS, flat: o.flat, mx: o.mx, my: o.my };
      if (!ob.tiles) { ob.tiles = []; for (i = 0; i < ob.w; i++) ob.tiles.push([o.c + i, o.r]); }
      if (o.open) ob.tiles = []; ob.touch = o.touch || ob.tiles;
      W.objs.push(ob); if (ob.id) W.byId[ob.id] = ob;
    });
    (def.actors || []).forEach(function (a) { var ac = makeActor(a); W.actors.push(ac); W.byId[ac.id] = ac; });
    W.hero = makeActor(def.hero); W.hero.hero = true; W.actors.push(W.hero); W.byId.hero = W.hero;
    return W;
  }
  function blocked(W, c, rr, self) {
    if (c < 0 || rr < 0 || c >= COLS || rr >= ROWS || W.solid[rr][c]) return true;
    for (var i = 0; i < W.objs.length; i++) for (var j = 0, t = W.objs[i].tiles; j < t.length; j++) if (t[j][0] === c && t[j][1] === rr) return true;
    for (i = 0; i < W.actors.length; i++) { var a = W.actors[i]; if (a !== self && !a.hidden && a.solid && a.c === c && a.r === rr) return true; }
    return false;
  }
  function startMove(a, d) { var q = DIRS[d]; a.dir = q.k; a.mv = { fx: a.x, fy: a.y, tx: a.x + q.dc * TS, ty: a.y + q.dr * TS, t: 0, dur: a.hero ? 0.15 : 0.2 }; a.c += q.dc; a.r += q.dr; }
  function updateActors(W, dt) {
    W.actors.forEach(function (a) {
      if (a.emote) { a.emote.t -= dt; if (a.emote.t <= 0) a.emote = null; }
      if (!a.mv) return;
      a.mv.t += dt; var f = Math.min(1, a.mv.t / (S.fast ? 0.001 : a.mv.dur));
      a.x = Math.round(a.mv.fx + (a.mv.tx - a.mv.fx) * f); a.y = Math.round(a.mv.fy + (a.mv.ty - a.mv.fy) * f); a.walk = f < 1 ? 1 + ((f * 2) | 0) : 0;
      if (f >= 1) { a.mv = null; if (a.hero) hooks.sfx('step'); }
    });
  }
  function tilesOf(it) { return it.touch || [[it.c, it.r]]; }
  function itemAt(W, c, rr) {
    for (var i = 0; i < W.actors.length; i++) { var a = W.actors[i]; if (!a.hero && !a.hidden && a.on && a.c === c && a.r === rr) return a; }
    for (i = 0; i < W.objs.length; i++) { var o = W.objs[i]; if (!o.on) continue; for (var j = 0; j < o.touch.length; j++) if (o.touch[j][0] === c && o.touch[j][1] === rr) return o; }
    return null;
  }
  function dirToward(h, c, rr) { var dc = c - h.c, dr = rr - h.r; return Math.abs(dc) >= Math.abs(dr) ? (dc > 0 ? 'right' : 'left') : (dr > 0 ? 'down' : 'up'); }
  function adjacentTo(W, h, it) {
    var t = tilesOf(it), best = null;
    for (var i = 0; i < t.length; i++) if (Math.abs(t[i][0] - h.c) + Math.abs(t[i][1] - h.r) === 1) best = t[i];
    return best;
  }
  // the shortest way from the hero to any tile that passes ok(c, r)
  function bfs(W, h, ok) {
    var q = [[h.c, h.r]], from = {}, k0 = h.c + ',' + h.r; from[k0] = null;
    while (q.length) {
      var cur = q.shift(), ck = cur[0] + ',' + cur[1];
      if (ok(cur[0], cur[1]) && ck !== k0) { var path = []; while (ck !== k0) { path.unshift(cur); cur = from[ck]; ck = cur[0] + ',' + cur[1]; } return path; }
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) { var c = cur[0] + d[0], rr = cur[1] + d[1], kk = c + ',' + rr; if (!(kk in from) && !blocked(W, c, rr, h)) { from[kk] = cur; q.push([c, rr]); } });
    }
    return ok(h.c, h.r) ? [] : null;
  }
  function headFor(W, it) {
    var h = W.hero, t = tilesOf(it);
    function near(c, rr) { for (var i = 0; i < t.length; i++) if (Math.abs(t[i][0] - c) + Math.abs(t[i][1] - rr) === 1) return true; return false; }
    if (near(h.c, h.r)) { W.path = []; W.goal = it; return true; }
    var path = bfs(W, h, near); if (!path) return false; W.path = path; W.goal = it; return true;
  }
  function interact(W, it) {
    var h = W.hero, a = adjacentTo(W, h, it); if (a) h.dir = DIRS[dirToward(h, a[0], a[1])].k;
    if (it.who && !it.keepDir) { var back = { u: 'd', d: 'u', l: 'r', r: 'l' }[h.dir]; it.dir = back; }
    W.subItem = it; W.sub = new Runner(it.on.call(it, W)); W.path = null; W.goal = null; hooks.sfx('ok');
  }
  function nextNeed(W) { for (var i = 0; i < W.need.length; i++) if (!W.done[W.need[i]]) return W.byId[W.need[i]]; return null; }
  function heroControl(W) {
    var h = W.hero; if (h.mv) return;
    var man = null;
    if (lastDir && held[lastDir]) man = lastDir; else ['up', 'down', 'left', 'right'].forEach(function (d) { if (held[d]) man = d; });
    ['up', 'down', 'left', 'right'].forEach(function (d) { if (take(d) && !man) man = d; });
    if (man) { W.path = null; W.goal = null; h.dir = DIRS[man].k; if (!blocked(W, h.c + DIRS[man].dc, h.r + DIRS[man].dr, h)) startMove(h, man); return; }
    if (W.path && W.path.length) { var nx = W.path.shift(), d = dirToward(h, nx[0], nx[1]); if (!blocked(W, nx[0], nx[1], h)) startMove(h, d); else { W.path = null; W.goal = null; } return; }
    if (W.goal) { var g = W.goal; W.goal = null; W.path = null; if (adjacentTo(W, h, g)) interact(W, g); return; }
    if (!S.auto) W.autoAt = 0; else if (!W.autoAt) W.autoAt = S.time + 0.6; else if (S.time >= W.autoAt) { W.autoAt = 0; var n3 = nextNeed(W); if (n3) { headFor(W, n3); return; } }
    if (take('a')) {
      var q = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[h.dir], it = itemAt(W, h.c + q[0], h.r + q[1]);
      if (!it) [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (e) { it = it || itemAt(W, h.c + e[0], h.r + e[1]); });
      if (it) interact(W, it); else { var nn = nextNeed(W); if (nn) headFor(W, nn); }
    }
    if (take('next')) { var n2 = nextNeed(W); if (n2) headFor(W, n2); }
  }
  // hand the room to the player until every id in o.need has been talked to
  function free(o) {
    var W;
    return {
      start: function () {
        W = S.world; if (!W) throw new Error('G.free needs a room: call G.enter first');
        W.need = (o.need || []).slice(); W.goals = o.goals || {}; W.free = true; S.objective = o.goal || '';
        W.need.forEach(function (id) { if (!W.byId[id] || !W.byId[id].on) throw new Error('the room needs "' + id + '", but nothing with that id has an "on" to talk to'); });
      },
      update: function (dt) {
        if (W.sub) {
          W.sub.step(dt);
          if (W.sub.done) { W.sub = null; if (W.subItem && W.subItem.id) W.done[W.subItem.id] = true; W.subItem = null; if (W.need.every(function (id) { return W.done[id]; })) { W.free = false; S.objective = ''; return true; } }
          return false;
        }
        var nn = nextNeed(W); if (nn && W.goals[nn.id]) S.objective = W.goals[nn.id];
        heroControl(W); return false;
      }
    };
  }
  function walk(id, c, rr) {
    var a, path;
    return {
      start: function () { var W = S.world; a = typeof id === 'string' ? W.byId[id] : id; path = bfs(W, a, function (x, y) { return x === c && y === rr; }) || []; },
      update: function () { if (a.mv) return false; if (!path.length) return true; var nx = path.shift(); startMove(a, dirToward(a, nx[0], nx[1])); return false; }
    };
  }
  function face(id, d) { return call(function () { S.world.byId[id].dir = d; }); }
  function emote(id, ch, sec) { return { start: function () { S.world.byId[id].emote = { ch: ch, t: sec || 0.9 }; hooks.sfx('pop'); }, update: function () { return !S.world.byId[id].emote || S.fast; } }; }

  function drawWorld(W, t) {
    W.bd(t);
    W.objs.forEach(function (o) { if (o.flat && o.draw) o.draw(o.c * TS, o.yb, t, o); });
    var list = [];
    W.objs.forEach(function (o) { if (!o.flat && o.draw) list.push({ y: o.yb, o: o }); });
    W.actors.forEach(function (a) { if (!a.hidden) list.push({ y: a.y + 1, a: a }); });
    list.sort(function (m, n) { return m.y - n.y; });
    var h = W.hero;
    list.forEach(function (q) {
      if (q.o) { q.o.draw(q.o.c * TS, q.o.yb, t, q.o); return; }
      var a = q.a, blink = (((t * 8) | 0) + a.c * 7 + a.r * 3) % 37 === 0;
      a.top = K.who(a.who, a.x, a.y, { dir: a.dir, walk: a.walk, blink: blink, armL: a.armL, armR: a.armR });
    });
    // name tags: the hero always, anyone beside the hero, anyone speaking. A tag that would cover another moves up.
    var tags = [];
    W.actors.forEach(function (a) {
      if (a.hidden || !a.tag) return;
      var near = Math.abs(a.c - h.c) + Math.abs(a.r - h.r) === 1, speaking = W.subItem === a || (S.text && S.text.name === a.tag && !a.hero);
      if (a.hero || a.always || speaking || (near && W.free && !W.sub)) { var w = tw(a.tag) + 4; tags.push({ a: a, x: Math.max(1, Math.min(SW - w - 1, a.x - (w >> 1))), y: Math.max(1, a.top - 10), w: w, pr: a.hero ? 1 : 0 }); }
    });
    tags.sort(function (m, n) { return m.pr - n.pr; });
    tags.forEach(function (q, i) {
      for (var tries = 0; tries < 4; tries++) { var hitT = false; for (var j = 0; j < i; j++) { var o = tags[j]; if (q.x < o.x + o.w + 1 && o.x < q.x + q.w + 1 && q.y < o.y + 8 && o.y < q.y + 8) hitT = true; } if (!hitT) break; q.y = Math.max(1, q.y - 9); }
      q.a.tagY = q.y; tag(q.a.x, q.y, q.a.tag, q.a.col || NAMECOL[q.a.tag] || 'k');
    });
    if (W.free && !W.sub) {
      W.actors.forEach(function (a) { if (!a.hero && !a.hidden && a.on && !W.done[a.id]) { var need = W.need.indexOf(a.id) >= 0; if (need || !a.seen) K.mark(a.x, (a.tag && Math.abs(a.c - h.c) + Math.abs(a.r - h.r) === 1 && a.tagY ? a.tagY : a.top) - 3, t + a.c, need ? 'k' : '3', need ? '!' : '?'); } });
      W.objs.forEach(function (o) { if (o.on && !W.done[o.id]) { var need = W.need.indexOf(o.id) >= 0; if (need || !o.seen) K.mark(o.mx !== undefined ? o.mx : o.c * TS + o.w * 6, o.my !== undefined ? o.my : o.yb - 22, t + o.c, need ? 'k' : '3', need ? '!' : '?'); } });
    }
    W.actors.forEach(function (a) { if (a.emote && !a.hidden) K.mark(a.x, a.top - 3, 0.3, 'k', a.emote.ch); });
    if (W.over) W.over(t, W);
  }
  function tag(cx, y, s, c) {
    var w = tw(s) + 4, x = Math.max(1, Math.min(SW - w - 1, cx - (w >> 1))); y = Math.max(1, y);
    r(x + 1, y, w - 2, 7, c); r(x, y + 1, w, 5, c); txt(s, x + 2, y + 1, 'w');
  }

  // ---------------------------------------------------------------- scene changes
  function snapshot() { prev.set(last); }
  function* fade(fn, dur) { snapshot(); fn(); dur = S.reduced ? 0.01 : (dur || 0.4); S.trans = { t: 0, dur: dur }; yield wait(dur); S.trans = null; }
  function* wipe(fn) {
    if (S.reduced) { yield* fade(fn); return; }
    S.flash = 0.12; yield wait(0.16); S.flash = 0.12; yield wait(0.16);
    S.wipe = { t: 0, dur: 0.42, dir: 1 }; yield wait(0.44); fn(); S.wipe = { t: 0, dur: 0.36, dir: -1 }; yield wait(0.38); S.wipe = null;
  }
  function clearModes() { S.world = null; S.battle = null; S.custom = null; S.card = null; S.objective = ''; S.roll = null; }
  function setHud(h) { if (!h) return; for (var k in h) S.hud[k] = h[k]; }
  function* enter(def, hud) { yield* fade(function () { clearModes(); S.world = makeWorld(def); S.mode = 'world'; setHud(hud); }); }
  function* show(draw, hud, tall) { yield* fade(function () { clearModes(); S.custom = { draw: draw, t0: S.time, tall: !!tall }; S.mode = 'custom'; setHud(hud); }); }
  function* card(c, hud) {
    yield* fade(function () { clearModes(); S.card = c; c.t0 = S.time; S.mode = 'card'; setHud(hud); }, 0.5);
    hooks.say('', c.plain || [c.kicker, c.title, c.sub, c.note].filter(Boolean).join('. '), 0, 'card'); hooks.sfx('card');
    yield wait(0.5); pressed.a = false;
    var ct = 0, cn = (c.plain || '').length * 0.6; yield { update: function (dt) { ct += dt; return take('a') || S.fast || autoDue(ct, cn); } };
  }
  // move the date and, with it, the meter in the status strip. value null hides the meter, undefined leaves it as it is
  function* advance(date, value, place) {
    S.hud.date = date; if (place !== undefined) S.hud.place = place;
    if (value === null || value === undefined) { S.hud.meter = value === null ? null : S.hud.meter; return; }
    S.hud.note = ''; if (S.hud.meter === null) S.hud.meter = 0;
    var m = CFG.meter || {}, rate = m.rate || (m.cap ? m.cap * 8 / 15 : 0);
    hooks.sfx('count'); yield tween(S.hud, 'meter', value, rate ? Math.min(1.4, 0.4 + Math.abs(value - S.hud.meter) / rate) : 0.8, true); S.hud.meter = value;
  }

  // ---------------------------------------------------------------- the fight
  // a side is a person (who), two people (kind 'pair', pair [a, b]) or anything the story draws (kind 'draw', draw(x, y, t, side))
  function side(d, dx) { var q = {}, k; for (k in d) q[k] = d[k]; q.kind = d.kind || 'person'; q.f = d.f === undefined ? 1 : d.f; q.col = d.col || 'C'; q.dx = dx; q.allies = d.allies || null; q.hop = 0; q.blink = 0; q.gone = false; return q; }
  function* battle(def, body) {
    hooks.sfx('fight');
    yield* wipe(function () { clearModes(); S.battle = { theme: def.theme || 'day', foe: side(def.foe, 110), me: side(def.me, -120), fx: [], t0: S.time }; S.mode = 'battle'; setHud(def.hud); });
    var B = S.battle;
    yield par([tween(B.foe, 'dx', 0, 0.45), tween(B.me, 'dx', 0, 0.45)]);
    if (def.intro) yield say('', def.intro);
    yield* body(B);
  }
  var SPOT = { me: [64, 74], foe: [134, 34] };
  // something thrown from one side to the other: kind is 'chat', 'notice', 'letter', 'lock', 'call', 'card', 'word' (o.text) or 'draw' (o.draw(x, y))
  function shoot(B, from, kind, o) {
    o = o || {}; var a = SPOT[from], b = SPOT[from === 'me' ? 'foe' : 'me'], f = { kind: kind, x: a[0], y: a[1], text: o.text, c: o.c, draw: o.draw }, t = 0, dur = o.dur || 0.6;
    return {
      start: function () { B.fx.push(f); B[from].hop = 0.25; hooks.sfx(kind === 'notice' || kind === 'lock' ? 'throw2' : 'throw'); },
      update: function (dt) { t += dt; var k = S.fast ? 1 : Math.min(1, t / dur); f.x = a[0] + (b[0] - a[0]) * k; f.y = a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * (o.arc === undefined ? 14 : o.arc); if (k >= 1) { B.fx.splice(B.fx.indexOf(f), 1); return true; } return false; }
    };
  }
  function hit(B, who, hard) { return { start: function () { B[who].blink = 0.5; S.shake = hard ? 0.35 : 0.2; hooks.sfx(hard ? 'hit2' : 'hit'); }, update: function () { return B[who].blink <= 0 || S.fast; } }; }
  function bar(B, who, to) { return { start: function () { hooks.sfx(to < B[who].f ? 'down' : 'up'); this.q = tween(B[who], 'f', to, 0.7); this.q.start(); }, update: function (dt) { return this.q.update(dt); } }; }
  function* swap(B, who, d) {
    var off = who === 'foe' ? 110 : -120; yield tween(B[who], 'dx', off, 0.3);
    var q = B[who]; for (var k in d) q[k] = d[k]; if (d.kind === undefined && d.who) q.kind = 'person';
    yield tween(B[who], 'dx', 0, 0.35);
  }
  function* flip(B, hud) { yield* wipe(function () { var m = B.me; B.me = B.foe; B.foe = m; B.me.dx = 0; B.foe.dx = 0; setHud(hud); }); }
  function drawFx(f) {
    var x = Math.round(f.x), y = Math.round(f.y);
    if (f.kind === 'chat') K.chat(x - 8, y - 5, 16, f.c);
    else if (f.kind === 'notice') K.env(x - 5, y - 4, 'X');
    else if (f.kind === 'letter') K.env(x - 5, y - 4, '2');
    else if (f.kind === 'lock') K.padlock(x - 4, y - 6, f.c);
    else if (f.kind === 'call') K.phone(x - 3, y - 5, f.c || 'e');
    else if (f.kind === 'card') { r(x - 6, y - 4, 13, 9, 'w'); box(x - 7, y - 5, 15, 11, 'k'); r(x - 4, y - 2, 9, 1, f.c || 'C'); r(x - 4, y, 7, 1, '5'); r(x - 4, y + 2, 8, 1, '5'); }
    else if (f.kind === 'word') K.sign(x, y - 4, f.text, f.c || 'k', 'w');
    else if (f.kind === 'draw' && f.draw) f.draw(x, y);
  }
  function drawBattle(B, t) {
    K.arena(B.theme, t);
    var F = B.foe, M = B.me, fx = 146 + Math.round(F.dx), fy = 52 - (F.hop > 0 ? 3 : 0), mx = 46 + Math.round(M.dx), hopM = M.hop > 0 ? 3 : 0;
    var showF = !F.gone && !(F.blink > 0 && ((t * 14) | 0) % 2), showM = !(M.blink > 0 && ((t * 14) | 0) % 2);
    if (showF) {
      if (F.kind === 'draw') F.draw(fx, fy, t, F);
      else if (F.kind === 'pair') { K.big(F.pair[0], fx - 13, fy, 2, { dir: 'r', armR: 'out' }); K.big(F.pair[1], fx + 13, fy, 2, { dir: 'l', armL: 'out' }); }
      else K.big(F.who, fx, fy, 2, { blink: (((t * 8) | 0) % 31) === 0 });
    }
    if (showM) {
      if (M.allies) { K.big(M.allies[0], mx - 33, 113 - hopM, 2, { dir: 'u' }); K.big(M.allies[1], mx + 35, 113 - hopM, 2, { dir: 'u' }); }
      if (M.kind === 'draw') M.draw(mx, 116 - hopM, t, M);
      else if (M.kind === 'pair') { K.big(M.pair[0], mx - 16, 116 - hopM, 3, { dir: 'u' }); K.big(M.pair[1], mx + 22, 116 - hopM, 3, { dir: 'u' }); }
      else K.big(M.who, mx, 116 - hopM, 3, { dir: 'u' });
    }
    B.fx.forEach(drawFx);
    if (Math.abs(F.dx) < 1 && F.name) K.statbox('foe', F.name, F.label, F.f, F.col);
    if (Math.abs(M.dx) < 1 && M.name) K.statbox('me', M.name, M.label, M.f, M.col);
    if (B.over) B.over(t, B);
  }

  // ---------------------------------------------------------------- lettering larger than the font
  function glyph(ch) { var g = FONT.big.glyphs; return g[ch] || g[ch.toUpperCase()] || null; }
  function bigW(s, n) { var w = 0; for (var i = 0; i < s.length; i++) { var g = s[i] === ' ' ? null : glyph(s[i]); w += ((g ? g.split('/')[0].length : FONT.big.space) + 1) * n; } return w - n; }
  function bigTxt(s, cx, y, c, n, sh) {
    for (var pass = sh ? 0 : 1; pass < 2; pass++) {
      var x = cx - (bigW(s, n) >> 1) + (pass ? 0 : n), yy = y + (pass ? 0 : n), col = pass ? c : sh;
      for (var i = 0; i < s.length; i++) {
        var g = s[i] === ' ' ? null : glyph(s[i]); if (!g) { x += (FONT.big.space + 1) * n; continue; }
        var rows = g.split('/'); for (var j = 0; j < rows.length; j++) for (var k = 0; k < rows[j].length; k++) if (rows[j][k] === '#') r(x + k * n, yy + j * n, n, n, col);
        x += (rows[0].length + 1) * n;
      }
    }
  }
  function drawCard(c, t) {
    var acc = c.acc || 'L', i;
    r(0, 0, SW, SH, 'a'); for (i = 0; i < 5; i++) PX.dith(0, 78 + i * 6, SW, 6, 'K', i < 2 ? 4 : i < 4 ? 3 : 2); r(0, 100, SW, 8, 'K');
    r(0, 0, SW, 3, acc);
    if (c.kicker) { var kw = tw(c.kicker) + 8; r((SW - kw) >> 1, 18, kw, 9, acc); txt(c.kicker, SW >> 1, 20, 'a', { a: 'c' }); }
    var n = bigW(c.title, 2) <= SW - 12 ? 2 : 1; bigTxt(c.title, SW >> 1, n === 2 ? 36 : 40, 'w', n, 'K');
    if (c.sub) txt(c.sub, SW >> 1, 60, '4', { a: 'c' });
    if (c.note) wrap(c.note, 170, 'small').forEach(function (l, j) { txt(l, SW >> 1, 72 + j * 7, acc === 'X' ? 'w' : acc, { a: 'c' }); });
    if (c.draw) c.draw(t);
    if (((t * 2) | 0) % 2 === 0) txt('▶', SW - 10, 96, 'w', { f: 'big' });
  }

  // ---------------------------------------------------------------- the story's link as a QR code
  var qrCache = null;
  function link() { return CFG.link || ''; }
  // the address in words: without the scheme, and in capitals when it is only a host name
  function linkText() { if (CFG.linkText) return CFG.linkText; var s = link().replace(/^[a-z]+:\/\//i, '').replace(/\/$/, ''); return s.indexOf('/') < 0 ? s.toUpperCase() : s; }
  function qrCode() { if (!link()) return null; if (!qrCache || qrCache.text !== link()) { qrCache = QR.make(link()) || { n: 0 }; qrCache.text = link(); } return qrCache.n ? qrCache : null; }
  /* Draw the code. (x, y) is its top left corner, or the corner named by o.anchor: 'tr', 'bl' or 'br'. An anchored code grows away
     from its corner, so a longer link never pushes it off the picture. o.scale pixels a module (1), o.pad white modules around it (2),
     o.frame a palette key for a one pixel frame, o.max the most pixels a side it may take (it then picks the largest scale that fits).
     Returns the pixels a side it took, frame included, or 0 when the story has no link. */
  function qr(x, y, o) {
    o = o || {}; var q = qrCode(); if (!q) return 0;
    var n = q.n, pad = o.pad === undefined ? 2 : o.pad, f = o.frame ? 1 : 0, s = o.scale || 1, i, j;
    if (o.max) { s = 1; while ((n + 2 * pad) * (s + 1) + 2 * f <= o.max) s++; }
    var size = (n + 2 * pad) * s, outer = size + 2 * f, a = o.anchor || 'tl';
    if (a === 'tr' || a === 'br') x -= outer; if (a === 'bl' || a === 'br') y -= outer;
    if (f) box(x, y, outer, outer, o.frame);
    r(x + f, y + f, size, size, 'w');
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) if (q.rows[j].charCodeAt(i) === 49) r(x + f + (pad + i) * s, y + f + (pad + j) * s, s, s, 'k');
    return outer;
  }
  // a long address broken into lines, after a slash or a dot where it can
  function wrapLink(s, maxw, f) {
    var lines = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      if (cur && tw(cur + s[i], f) > maxw) {
        var cut = -1; for (var j = cur.length - 1; j > 0 && j > cur.length - 14; j--) if ('/.-_?&='.indexOf(cur[j]) >= 0) { cut = j + 1; break; }
        if (cut > 0 && cut < cur.length) { lines.push(cur.slice(0, cut)); cur = cur.slice(cut); } else { lines.push(cur); cur = ''; }
      }
      cur += s[i];
    }
    if (cur) lines.push(cur); return lines;
  }
  // the code large enough to scan from the back of a room, with the address in words. The code takes what the address leaves.
  function playAlongLayout() {
    var q = qrCode(), text = linkText(), big = tw(text, 'big') <= 186, lines = big ? [text] : wrapLink(text, 186, 'small'), lh = big ? 9 : 7;
    var ay = big ? 122 : 140 - 4 - lines.length * lh, room = ay - 9 - 2, s, pad, fit = null;
    for (s = 6; s >= 1 && !fit; s--) for (pad = 4; pad >= 2 && !fit; pad--) if ((q.n + 2 * pad) * s <= room) fit = { s: s, pad: pad };
    fit = fit || { s: 1, pad: 2 };
    return { lines: lines, big: big, lh: lh, ay: ay, s: fit.s, pad: fit.pad, size: (q.n + 2 * fit.pad) * fit.s };
  }
  function drawPlayAlong(t) {
    var L = playAlongLayout(), cx = (5 + L.size + 2 + SW) >> 1;
    r(0, 0, SW, SH + PAN, 'a'); qr(5, 4, { scale: L.s, pad: L.pad, frame: 'l' });
    bigTxt('PLAY', cx, 12, 'l', 2, 'a'); bigTxt('ALONG', cx, 30, 'l', 2, 'a');
    txt('SCAN WITH YOUR', cx, 56, 'w', { a: 'c' }); txt('PHONE CAMERA', cx, 64, 'w', { a: 'c' });
    txt('THE GAME OPENS', cx, 78, '4', { a: 'c' }); txt('IN YOUR BROWSER', cx, 86, '4', { a: 'c' });
    if (L.ay >= 114 && ((t * 2) | 0) % 2 === 0) txt('ENTER: BACK', cx, 106, '3', { a: 'c' });
    L.lines.forEach(function (l, i) { txt(l, 96, L.ay + i * L.lh, 'w', { a: 'c', f: L.big ? 'big' : 'small' }); });
  }

  // ---------------------------------------------------------------- the title screen
  // The story draws the picture (drawTitle). The menu under it is the engine's: START, CHAPTERS, PLAY ALONG if the story has a link, AUTO.
  function plainTitle() { r(0, 0, SW, SH, 'a'); PX.dith(0, 84, SW, 24, 'K', 3); var s = CFG.menuTitle || CFG.title || '', n = bigW(s, 2) <= SW - 12 ? 2 : 1; if (bigW(s, 1) <= SW - 4) bigTxt(s, SW >> 1, 40, 'w', n, 'K'); else wrap(s, SW - 12, 'big').forEach(function (l, i) { txt(l, SW >> 1, 34 + i * 10, 'w', { a: 'c', f: 'big' }); }); }
  function* titleFlow() {
    var draw = STORY.drawTitle || plainTitle, HUD0 = { date: '', place: CFG.titleHint, meter: null }, at = 0;
    yield* show(draw, HUD0);
    for (;;) {
      var opts = ['START', 'CHAPTERS']; if (qrCode()) opts.push('PLAY ALONG'); opts.push('AUTO: ' + AUTO[S.auto]);
      var i = yield menu(CFG.menuTitle || '', opts, { sel: at, id: 'title' }), pick = opts[i].split(':')[0];
      at = i;
      if (pick === 'START') { S.sub = 0; return 0; }
      if (pick === 'CHAPTERS') { var c = yield* chapterMenu(true); if (c >= 0) return c; }
      if (pick === 'PLAY ALONG') {
        yield* show(drawPlayAlong, { date: 'PLAY ALONG', place: '', meter: null }, true); yield wait(0.3);
        yield { update: function () { return take('a') || take('b'); } };
        yield* show(draw, HUD0);
      }
      if (pick === 'AUTO') cycleAuto();
    }
  }

  // ---------------------------------------------------------------- the end roll: pages that scroll, each a picture, a question and what the story says to it
  /* pages: [{ part: 1, q: 'THE QUESTION', head: 'The claim.', body: ['A reason.', 'Another.'], draw: function (t, y) { ... }, hud: { ... } }, ...]
     draw paints a picture 176 wide and 34 tall with its top left corner at (8, y). part groups pages, for the dots at the foot and for o.part.
     o.hud is the status strip for every page; a page's own hud overrides it. o.part starts at the first page of that part. */
  function rollPage(P, oy, t, shown) {
    var y = oy + 4, ql = P.q ? wrap(P.q, 164, 'small') : [], qw = 0;
    if (P.draw) P.draw(t, y); box(7, y - 1, 178, 36, '3');
    y = oy + 43; ql.forEach(function (l, i) { txt(l, 96, y + i * 7, 'L', { a: 'c' }); qw = Math.max(qw, tw(l)); });
    if (ql.length) {
      var x0 = 96 - (qw >> 1) - 6, x1 = 96 + (qw >> 1) + 5, h = ql.length * 7 + 1;
      r(x0, y - 2, 1, h, 'l'); r(x0, y - 2, 3, 1, 'l'); r(x0, y - 3 + h, 3, 1, 'l'); r(x1, y - 2, 1, h, 'l'); r(x1 - 2, y - 2, 3, 1, 'l'); r(x1 - 2, y - 3 + h, 3, 1, 'l');
      y += ql.length * 7 + 4;
    }
    wrap(P.head, 180, 'big').forEach(function (l) { if (shown > 0) txt(l, 96, y, 'l', { a: 'c', f: 'big' }); y += 9; }); y += 3;
    (P.body || []).forEach(function (para, i) { wrap(para, 180, 'big').forEach(function (l) { if (i + 1 < shown) txt(l, 96, y, 'w', { a: 'c', f: 'big' }); y += 9; }); y += 2; });
    return y - 2;
  }
  function* roll(pages, o) {
    o = o || {}; var first = 0, n = pages.length, i; for (i = n - 1; i >= 0; i--) if (o.part && pages[i].part === o.part) first = i;
    var st = { page: first, part: pages[first].part, from: -1, dir: 1, scroll: 1, shown: 0, full: false, over: false, pages: n };
    function hud(P) { var h = {}, k; for (k in o.hud || {}) h[k] = o.hud[k]; for (k in P.hud || {}) h[k] = P.hud[k]; return h; }
    yield* show(function (t) {
      r(0, 0, SW, SH + PAN, 'a'); PX.dith(0, 132, SW, 8, 'K', 3);
      var off = st.from >= 0 ? Math.round((1 - st.scroll) * 140) * st.dir : 0;
      if (st.from >= 0) rollPage(pages[st.from], off - 140 * st.dir, t, 99);
      if (rollPage(pages[st.page], off, t, st.shown) > 131) st.over = true;
      for (var k = 0; k < n; k++) r(6 + k * 4, 135, 2, 2, k === st.page ? 'w' : pages[k].part === pages[st.page].part ? 'L' : '2');
      if (st.full && st.from < 0 && ((t * 2) | 0) % 2 === 0) txt('▶', 180, 130, 'w', { f: 'big' });
    }, hud(pages[first]), true);
    S.roll = st;
    for (;;) {
      var P = pages[st.page], body = P.body || [], back = false, total = body.length + 1, chars = (P.head + body.join('')).length * 0.5, ft = 0; st.shown = 0; st.full = false; st.part = P.part;
      setHud(hud(P)); hooks.say(P.q || '', P.head + (body.length ? ' ' + body.join(' ') : ''), 0, 'roll'); hooks.sfx('card');
      yield { update: function (dt) {
        if (!st.full) { st.shown += dt / 0.5; if (take('a') || S.fast || S.reduced) st.shown = total; if (st.shown >= total) { st.shown = total; st.full = true; } return false; }
        if (take('left') || take('up') || take('b')) { if (st.page > 0) { back = true; return true; } return false; }
        ft += dt; return take('a') || take('right') || take('down') || S.fast || autoDue(ft, chars);
      } };
      if (!back && st.page === n - 1) break;
      st.from = st.page; st.dir = back ? -1 : 1; st.page += st.dir; st.scroll = 0; st.shown = 0; st.full = false; hooks.sfx('next');
      yield tween(st, 'scroll', 1, S.reduced ? 0 : 0.5); st.from = -1;
    }
    S.roll = null;
  }

  // ---------------------------------------------------------------- the frame: status strip, scene, text panel
  function commas(v) { var s = String(Math.round(v)), neg = s[0] === '-', o = ''; if (neg) s = s.slice(1); while (s.length > 3) { o = ',' + s.slice(-3) + o; s = s.slice(0, -3); } return (neg ? '-' : '') + s + o; }
  // the status strip: the date and the place on the left and, if the story set one up, a meter on the right
  function drawHud() {
    r(0, 0, FW, HUD, 'k'); r(0, HUD - 1, FW, 1, 'K');
    var x = 3; if (S.hud.date) { txt(S.hud.date, x, 2, 'w'); x += tw(S.hud.date) + 5; }
    var right = FW - 3, m = CFG.meter || {}, v = S.hud.meter, label = m.label || '';
    if (v !== null && v !== undefined) {
      var s = m.text ? m.text(v) : commas(v), bw = 30;
      if (m.cap) { r(right - bw, 3, bw, 4, 'K'); r(right - bw, 3, Math.round(bw * Math.max(0, Math.min(1, v / m.cap))), 4, m.col || 'X'); box(right - bw - 1, 2, bw + 2, 6, '3'); right -= bw + 4; }
      txt(s, right, 2, 'w', { a: 'r' }); right -= tw(s) + 4; if (label) { txt(label, right, 2, m.labelCol || 'V', { a: 'r' }); right -= tw(label) + 5; }
    }
    else if (S.hud.note) { txt(S.hud.note, right, 2, 'w', { a: 'r' }); right -= tw(S.hud.note) + 4; if (label) { txt(label, right, 2, m.labelCol || 'V', { a: 'r' }); right -= tw(label) + 5; } }
    if (S.hud.place && x + tw(S.hud.place) < right) txt(S.hud.place, x, 2, '4');
  }
  var PY = HUD + SH;
  function panelBox(title, col) {
    var x = 2, y = PY + 4, w = 188, h = 26;
    r(x + 1, y, w - 2, h, 'w'); r(x, y + 1, w, h - 2, 'w');
    r(x + 1, y - 1, w - 2, 1, 'L'); r(x + 1, y + h, w - 2, 1, 'L'); r(x - 1, y + 1, 1, h - 2, 'L'); r(x + w, y + 1, 1, h - 2, 'L');
    r(x + 2, y + 1, w - 4, 1, '5'); r(x + 2, y + h - 2, w - 4, 1, '5'); r(x + 1, y + 2, 1, h - 4, '5'); r(x + w - 2, y + 2, 1, h - 4, '5');
    if (title) { var twd = tw(title) + 6; r(x + 6, y - 3, twd, 7, col || 'k'); r(x + 5, y - 2, twd + 2, 5, col || 'k'); txt(title, x + 9, y - 2, 'w'); }
    return { x: x, y: y, w: w, h: h };
  }
  function drawPanel(t) {
    r(0, PY, FW, PAN, 'a'); r(0, PY, FW, 1, 'K');
    var T = S.text, M = S.menu, b, i;
    if (M && !M.list) {
      b = panelBox(M.title, M.col);
      var f = 'big'; M.opts.forEach(function (s) { if (tw(s, 'big') > 80) f = 'small'; });
      for (i = 0; i < M.opts.length; i++) {
        var ox = b.x + 14 + (i % 2) * 92, oy = b.y + 6 + ((i / 2) | 0) * 9;
        txt(M.opts[i], ox, oy + (f === 'small' ? 1 : 0), 'k', { f: f });
        if (i === M.sel) { txt('▶', ox - 8, oy, ((t * 3) | 0) % 2 ? 'b' : 'k', { f: 'big' }); }
      }
      return;
    }
    if (T) {
      b = panelBox(T.name, T.col); var lines = T.lines.slice(T.page * 2, T.page * 2 + 2), n = T.n | 0;
      for (i = 0; i < lines.length; i++) { drawMarked(lines[i], T.offs[T.page * 2 + i], T.cols, Math.max(0, n), b.x + 7, b.y + 6 + i * 9); n -= lines[i].length; }
      if (T.full && ((t * 3) | 0) % 2 === 0) { var ax = b.x + b.w - 8, ay = b.y + b.h - 4; r(ax, ay, 5, 1, 'b'); r(ax + 1, ay + 1, 3, 1, 'b'); p(ax + 2, ay + 2, 'b'); }
      return;
    }
    var wp = S.mode === 'world' && S.world && S.world.panel;
    if (S.objective && S.mode === 'world') { txt('▶', 5, PY + (wp ? 2 : 6), 'l', { f: 'big' }); txt(S.objective, 13, PY + (wp ? 4 : 8), 'w'); if (wp) wp(t, PY); else txt(S.hint || 'ARROWS: WALK    A: TALK OR GO THERE', 13, PY + 20, '3'); }
    else if (wp) wp(t, PY);
    else if (S.hint2) txt(S.hint2, 13, PY + 14, '3');
  }
  function drawList(M, t) {
    var n = M.opts.length, w = 0, i; M.opts.forEach(function (s) { w = Math.max(w, tw(s, 'big')); }); w += 26; if (M.title) w = Math.max(w, tw(M.title) + 16);
    var h = n * 11 + 9, x = (SW - w) >> 1, y = M.y !== undefined ? M.y : Math.max(6, ((SH - h) >> 1) + (M.title ? 3 : 0));
    r(x + 1, y, w - 2, h, 'w'); r(x, y + 1, w, h - 2, 'w'); r(x + 1, y - 1, w - 2, 1, 'k'); r(x + 1, y + h, w - 2, 1, 'k'); r(x - 1, y + 1, 1, h - 2, 'k'); r(x + w, y + 1, 1, h - 2, 'k');
    r(x + 2, y + h + 1, w - 2, 1, 'K');
    if (M.title) { var twd = tw(M.title) + 6; r(x + 5, y - 4, twd, 7, M.col || 'k'); txt(M.title, x + 8, y - 3, 'w'); }
    for (i = 0; i < n; i++) { txt(M.opts[i], x + 16, y + 5 + i * 11, 'k', { f: 'big' }); if (i === M.sel) txt('▶', x + 7, y + 5 + i * 11, ((t * 3) | 0) % 2 ? 'b' : 'k', { f: 'big' }); }
    M.box = { x: x, y: y, w: w, h: h };
  }
  function draw() {
    var t = S.time, i, x, y;
    if (S.mode === 'custom' && S.custom && S.custom.tall) {
      PX.size(SW, SH + PAN); var tb = PX.buf(); S.custom.draw(t - S.custom.t0, t); if (S.menu && S.menu.list) drawList(S.menu, t);
      last.set(tb.subarray(0, SW * SH));
      if (S.trans) { var lt = Math.round(Math.min(1, S.trans.t / S.trans.dur) * 16); for (i = 0; i < SW * SH; i++) { x = i % SW; y = (i / SW) | 0; if (BAYER[(y & 3) * 4 + (x & 3)] >= lt) tb[i] = prev[i]; } }
      PX.size(FW, FH); var tf = PX.buf(); tf.set(tb, HUD * FW); drawHud(); autoChip(true); return tf;
    }
    PX.size(SW, SH); var sb = PX.buf();
    if (S.mode === 'card' && S.card) drawCard(S.card, t - S.card.t0);
    else if (S.mode === 'battle' && S.battle) drawBattle(S.battle, t);
    else if (S.mode === 'custom' && S.custom) S.custom.draw(t - S.custom.t0, t);
    else if (S.mode === 'world' && S.world) drawWorld(S.world, t);
    else r(0, 0, SW, SH, 'a');
    if (S.menu && S.menu.list) drawList(S.menu, t);
    last.set(sb);
    if (S.trans) { var lv = Math.round(Math.min(1, S.trans.t / S.trans.dur) * 16); for (i = 0; i < sb.length; i++) { x = i % SW; y = (i / SW) | 0; if (BAYER[(y & 3) * 4 + (x & 3)] >= lv) sb[i] = prev[i]; } }
    if (S.wipe) { var k = Math.min(1, S.wipe.t / S.wipe.dur); if (S.wipe.dir < 0) k = 1 - k; var ww = Math.round(k * SW); for (y = 0; y < SH; y++) { if (((y / 9) | 0) % 2) r(SW - ww, y, ww, 1, 'k'); else r(0, y, ww, 1, 'k'); } }
    if (S.flash > 0) for (i = 0; i < sb.length; i++) if (((i % SW) + ((i / SW) | 0)) & 1) sb[i] = PX.C.w;
    PX.size(FW, FH); var fb = PX.buf();
    var sx = 0, sy = 0; if (S.shake > 0 && !S.reduced) { sx = (((t * 40) | 0) % 2) * 2 - 1; sy = (((t * 31) | 0) % 2); }
    r(0, HUD, FW, SH, 'k');
    for (y = 0; y < SH; y++) { var yy = y + sy; if (yy < 0 || yy >= SH) continue; for (x = 0; x < SW; x++) { var xx = x + sx; if (xx < 0 || xx >= SW) continue; fb[(HUD + yy) * FW + xx] = sb[y * SW + x]; } }
    drawHud(); drawPanel(t); autoChip(false);
    return fb;
  }
  // a small mark while auto play is on: on the top edge of the text panel, or at the foot of a full-height scene
  function autoChip(tall) {
    if (!S.auto || S.act < 0) return; var s = S.auto === 2 ? 'AUTO' : 'AUTO: MOVES', w = tw(s) + 5, x = tall ? 96 - (w >> 1) : FW - w - 2, y = HUD + (tall ? 132 : SH + 1);
    r(x, y, w, 7, 'a'); r(x, y, 2, 7, 'l'); txt(s, x + 4, y + 1, 'l');
  }

  // ---------------------------------------------------------------- the clock
  var runner = null;
  function tick(ms) {
    var dt = Math.min(0.1, ms / 1000); S.time += dt;
    pressed = {}; queue.forEach(function (b) { pressed[b] = true; }); queue.length = 0;
    if (pressed.next && !S.menu && !(S.world && S.world.free && !S.world.sub && !S.text)) { pressed.next = false; pressed.a = true; }
    if (S.shake > 0) S.shake -= dt; if (S.flash > 0) S.flash -= dt;
    if (S.trans) S.trans.t += dt; if (S.wipe) S.wipe.t += dt;
    if (S.pauseRun) { var pr = S.pauseRun; pr.step(dt); if (S.pauseRun === pr && pr.done) S.pauseRun = null; return; }
    if (take('start') && S.act >= 0) { S.pauseRun = new Runner(pauseMenu()); return; }
    if (S.world) updateActors(S.world, dt);
    if (S.battle) { ['foe', 'me'].forEach(function (w) { var q = S.battle[w]; if (q.hop > 0) q.hop -= dt; if (q.blink > 0) q.blink -= dt; }); }
    if (runner) runner.step(dt);
  }
  // ---------------------------------------------------------------- the whole game: the title, each act in turn, the end, the title again
  function reset() { S.text = null; S.menu = null; S.trans = null; S.wipe = null; S.shake = 0; S.flash = 0; S.hud = { date: '', place: '', meter: null, note: '' }; S.vars = {}; S.ended = false; S.hint2 = ''; clearModes(); }
  function* mainFrom(i) {
    for (;;) {
      if (i < 0) i = yield* (STORY.title || titleFlow)();
      for (; i < acts.length; i++) { S.act = i; hooks.act(i, acts[i]); if (acts[i].init) acts[i].init(); yield* acts[i].run(); S.sub = 0; }
      S.act = acts.length; S.ended = true; if (STORY.end) yield* STORY.end(); S.plays++; S.act = -1; reset(); i = -1;
    }
  }
  function start(i, sub) { reset(); S.sub = sub || 0; S.act = i === undefined ? -1 : i; S.pauseRun = null; runner = new Runner(mainFrom(i === undefined ? -1 : i)); }
  function* chapterMenu(cancel) {
    for (;;) {
      var names = acts.map(function (a) { return a.menu; }), i = yield menu('CHAPTERS', names, { list: true, cancel: cancel, sel: Math.max(0, Math.min(acts.length - 1, S.act)), id: 'chapters' });
      S.sub = 0; if (i < 0 || !acts[i].sub) return i;
      var k = yield menu(acts[i].sub.title, acts[i].sub.opts, { list: true, cancel: true, id: 'parts' });
      if (k >= 0) { S.sub = k; return i; }
    }
  }
  function* pauseMenu() {
    var keepText = S.text, keepMenu = S.menu, at = 0; S.text = null; S.menu = null;
    for (;;) {
      var i = yield menu('PAUSED', ['RESUME', 'CHAPTERS', 'SOUND: ' + (S.sound ? 'ON' : 'OFF'), 'AUTO: ' + AUTO[S.auto], 'TITLE SCREEN'], { list: true, cancel: true, sel: at, id: 'pause' });
      at = Math.max(0, i);
      if (i === 2) { S.sound = !S.sound; hooks.sfx('ok'); continue; }
      if (i === 3) { cycleAuto(); continue; }
      if (i === 1) { var c = yield* chapterMenu(true); if (c >= 0) { start(c, S.sub); return; } continue; }
      if (i === 4) { start(); return; }
      break;
    }
    S.text = keepText; S.menu = keepMenu;
  }
  // a link to a chapter: #act-2 opens the second act, #act-4-3 its third part. An act whose parts have a link name,
  // sub: { link: 'question' }, also opens from #question-3. Returns [act, part] or null.
  function fromHash(h) {
    var m = /^#act-?(\d+)(?:-(\d+))?$/.exec(h || ''), i, k;
    if (m) { i = +m[1] - 1; k = m[2] ? +m[2] : 0; if (i < 0 || i >= acts.length) return null; return [i, acts[i].sub && k < acts[i].sub.opts.length ? k : 0]; }
    m = /^#([a-z]+)-?(\d+)$/.exec(h || '');
    if (m) for (i = 0; i < acts.length; i++) if (acts[i].sub && acts[i].sub.link === m[1]) { k = +m[2]; if (k >= 1 && k < acts[i].sub.opts.length) return [i, k]; }
    return null;
  }

  // a pointer on the frame, in frame pixels
  function point(x, y) {
    var M = S.menu, i;
    if (M && M.list && M.box) { y -= HUD; if (x >= M.box.x && x < M.box.x + M.box.w) { i = Math.floor((y - M.box.y - 3) / 11); if (i >= 0 && i < M.opts.length) { M.pick = i; return; } } return; }
    if (M) { if (y >= PY) { i = (x > 96 ? 1 : 0) + (y > PY + 19 ? 2 : 0); if (i < M.opts.length) M.pick = i; } return; }
    if (S.text || S.mode !== 'world' || !S.world || !S.world.free || S.world.sub) { tap('a'); return; }
    var W = S.world, h = W.hero; y -= HUD; if (y < 0 || y >= SH) { tap('a'); return; }
    for (i = 0; i < W.actors.length; i++) { var a = W.actors[i]; if (!a.hero && !a.hidden && a.on && Math.abs(x - a.x) <= 7 && y >= a.y - 22 && y <= a.y + 2) { headFor(W, a); return; } }
    var c = Math.floor(x / TS), rr = Math.floor((y - FY) / TS), it = rr >= 0 ? itemAt(W, c, rr) : null;
    if (!it) for (i = 0; i < W.objs.length; i++) { var o = W.objs[i]; if (o.on && x >= o.c * TS && x < (o.c + o.w) * TS && y >= o.yb - 30 && y <= o.yb) it = o; }
    if (it) { headFor(W, it); return; }
    if (rr >= 0 && !blocked(W, c, rr, h)) { var path = bfs(W, h, function (cc, r2) { return cc === c && r2 === rr; }); if (path) { W.path = path; W.goal = null; } }
  }

  return {
    S: S, FW: FW, FH: FH, HUD: HUD, SW: SW, SH: SH, PAN: PAN, hooks: hooks, NAMECOL: NAMECOL,
    // what the page and the tools use
    init: function (font) { FONT = font; PX.setFont(font); }, start: start, tick: tick, draw: draw,
    down: down, up: up, tap: tap, take: take, point: point, pick: function (i) { if (S.menu) S.menu.pick = i; },
    config: config, story: story, cfg: function () { return CFG; }, acts: function () { return acts; }, fromHash: fromHash,
    // what a story's script may use
    say: say, menu: menu, wait: wait, call: call, tween: tween, par: par, free: free, walk: walk, face: face, emote: emote,
    enter: enter, show: show, card: card, fade: fade, wipe: wipe, advance: advance, setHud: setHud, roll: roll,
    battle: battle, shoot: shoot, hit: hit, bar: bar, swap: swap, flip: flip, sfx: sfx,
    qr: qr, qrCode: qrCode, link: link, linkText: linkText, playAlongLayout: playAlongLayout,
    chapterMenu: chapterMenu, bigTxt: bigTxt, bigW: bigW, tag: tag, wrap: wrap, commas: commas,
    AUTO: AUTO, autoDue: autoDue, cycleAuto: cycleAuto
  };
})();
if (typeof module !== 'undefined') module.exports = G;
