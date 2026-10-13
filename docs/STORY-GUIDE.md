# Story guide

How to write a story for the pixel case engine. Read `stories/starter/story.js` beside this guide:
it uses each piece once, and every example below is in the same style.

## A story folder

A story is a folder under `stories/`. The builder reads these files from it, in this order.

| File | What it holds | Needed |
|---|---|---|
| `config.js` | The words around the game and the settings | Yes |
| `art.js` | Drawings that belong to your case only | No |
| `story.js` | The cast, the scenes and the acts | Yes |
| `checks.js` | Checks that belong to your case only | No |

Build a story with one command, run from the top folder:

```
python3 -I build.py stories/my-case dist/my-case.html
```

## The screen

The game screen is 192 pixels wide and 150 high. It has three bands.

| Band | Size | What it shows |
|---|---|---|
| Status strip | 192 by 10 | A date, a place and the meter |
| Scene | 192 by 108 | The room, the fight, the picture or the card |
| Panel | 192 by 32 | The text box, a choice or the goal of a room |

Every drawing gives positions in scene pixels. `x` counts from the left edge and `y` from the top.
The point (0, 0) is the top left corner of the scene and (191, 107) the bottom right.

Text on screen is short by design. The text box holds two lines of about 29 characters. The builder
stops if a line needs a third.

## The palette

A colour is one character between quote marks. The engine has no other colours.

| Keys | Colour |
|---|---|
| `k` `K` `1` `2` `3` `4` `5` `6` `w` | Ink to white, in nine steps |
| `a` | Night navy, the ground of the panel |
| `A` `B` `D` `E` | A periwinkle sky, top to horizon |
| `F` `G` `I` `J` | A cyan sky, top to horizon |
| `n` `N` `m` | Indigo, dark to light |
| `b` `L` | Blue, dark and light |
| `c` `C` `e` | Teal, dark to light |
| `v` `V` `W` | Violet, dark to light |
| `g` `h` `i` | Green land, dark to light |
| `q` `Q` `u` | Sea, dark to light |
| `y` `Y` | Snow |
| `s` `S` `d` `M` | Skin tones, light to deep |
| `U` | Steel |
| `l` `o` | Lamp aqua, for marks and highlights |
| `X` `r` `R` | Reds, for small marks only: a notice, a deadline, a seal |

The palette is cool-toned by rule. In every colour the red value is below the blue value, so no
ground is warm or yellow. The three reds are the only exceptions and they are never used to fill a
ground. A good habit is to give each party one colour and keep to it: in the starter Seller Co is
blue and Buyer Co is teal.

A story may add colours in `art.js` or `story.js`:

```js
PX.add({ z: '#3050a0', Z: '#8fa6e0' });
```

The builder applies the same rule to them. It stops at a colour whose red is not below its blue.

## Settings in config.js

`config.js` is one call, `G.config({ ... })`. Every setting is optional except `title`.

| Setting | What it does |
|---|---|
| `id` | A short name with no spaces. The page remembers the sound setting under it |
| `title` | The browser tab and the heading over the game |
| `kicker` | The small line above the heading |
| `lede` | The paragraph under the game. `<kbd>N</kbd>` shows N as a key |
| `foot` | The note at the foot of the page: your sources and any disclaimer |
| `lang` | The language of the page, `en` unless you say otherwise |
| `keys` | Your own list of keys in place of the engine's, one line of text each |
| `menuTitle` | The label on the title menu, in capitals |
| `titleHint` | The line in the status strip on the title screen |
| `link` | The full web address where the game is published. See "The link and its code" |
| `linkText` | The address as written on the PLAY ALONG card, if the engine's wording does not suit |
| `speakers` | The colour of each speaker's name, for example `{ 'BUYER CO': 'c' }` |
| `meter` | The running number in the status strip. See "The status strip and the meter" |
| `transcript` | Settings for the story as text. See below |
| `checks` | `{ maxLines: 3 }` lets a text box run to three lines before the builder stops |

**The story as text.** The builder plays the route on the record and writes every line under the
game as plain text. On screen everything is in capitals, so the builder puts labels back into
ordinary writing. `transcript.keep` lists the words that must keep their own spelling:

```js
transcript: { keep: { EUR: 'EUR', JUNE: 'June', 'CO:': 'Co:' }, skipMenus: ['A MENU TO LEAVE OUT'] }
```

## The shape of story.js

`story.js` ends with one call that hands the engine your title picture and your acts:

```js
G.story({
  drawTitle: drawTitle,
  acts: [
    { menu: '1 THE DELIVERY', heading: 'Act 1: the delivery', run: act1 },
    { menu: '2 A PROPOSAL', heading: 'Act 2: a proposal', run: act2 }
  ]
});
```

| Field | What it does |
|---|---|
| `drawTitle` | A function that draws the picture behind the title menu. Leave it out for a plain title |
| `acts` | The acts in order |
| `menu` | The name of the act in the CHAPTERS list |
| `heading` | The name of the act in the story as text |
| `run` | The script of the act |
| `init` | A function to run before the act starts, for example to reset your own values |
| `sub` | Parts of an act that open on their own: `{ title: 'THE QUESTIONS', opts: ['FROM THE START', '1 FIRST', '2 SECOND'], link: 'question' }` |
| `end` | A script to play after the last act, before the game returns to the title |
| `title` | Your own title script, if you want to replace the engine's menu. It must return the number of the act to start |

**Scripts.** A script is a function with a star, `function* act1() { ... }`. It is a list of steps
played in order. Two words carry it:

- `yield` before one step: do this and wait until it is over. `yield G.say('', 'A line.');`
- `yield*` before a step that is itself a script: `yield* G.card({ ... });`

The table of calls below says which word each call takes. A choice hands back the player's pick:
`var i = yield G.menu(...)`.

**Parts of an act.** When the player opens part 2 from the CHAPTERS list, the act starts with
`G.S.sub` set to 2. The act decides what that means. The usual use is `G.roll(pages, { part: G.S.sub })`.

**Links.** `#act-2` at the end of the page's address opens the second act. `#act-2-3` opens its third
part. If the act's `sub` has `link: 'question'`, then `#question-3` does the same.

## What a script may call

### Text

`yield G.say(name, text, options)` shows a line in the text box and waits for the player.

```js
yield G.say('', 'The pumps were due on 1 June.');                 // no speaker: the narrator
yield G.say('DRIVER', 'Sorry. The port was shut for seven days.'); // a speaker, in capitals
```

Three marks colour part of a line. They are not shown.

| Mark | Effect | Use |
|---|---|---|
| `{words}` | A party's colour: blue, or the colour in `{ hi: 'c' }` | What a side needs |
| `[words]` | A highlighter | What may be passed on |
| `<words>` | Red | What must stay private |

```js
yield G.say('', 'Buyer Co needs {the pumps} and {the price back}.', { hi: 'c' });
```

Options: `hi` the colour for braces, `col` the colour of the name, `auto: 2` moves on by itself
after two seconds.

### Choices

`var i = yield G.menu(title, options, settings)` shows a choice and returns the number of the pick,
counted from 0.

```js
var i = yield G.menu('BUYER CO: HOW TO RAISE IT', ['A PHONE CALL', 'A FORMAL NOTICE'], { canon: 1, col: 'c' });
if (i === 0) yield G.say('', 'On the record, nobody called. Buyer Co wrote.');
```

`canon` is the move on the record. The N key, auto play and the story as text all follow it. Give
every choice that is part of the facts a `canon`, answer each other option with one line from your
source, then let the record play. That keeps the story on the record whatever the player picks.

A menu in the panel holds up to four options. An option of up to about 13 characters is set in the
large font, a longer one of up to about 19 in the small font. With `list: true` the menu is a column
over the scene and holds up to eight options. Other settings: `col` the colour of the title,
`sel` the option the cursor starts on, `cancel: true` lets B close the menu and return -1.

### Cards

`yield* G.card(card, hud)` shows a title card for an act and waits.

```js
yield* G.card({ kicker: 'ACT 1', title: 'THE DELIVERY', sub: 'BUYER CO\'S WAREHOUSE, 11 JUNE',
  note: 'SELLER CO OWED FORTY PUMPS BY 1 JUNE.', acc: 'e',
  plain: 'Buyer Co\'s warehouse, 11 June. Seller Co owed forty pumps by 1 June.' });
```

`acc` is the accent colour. `plain` is the same text in ordinary writing, for the story as text.
`draw` is an optional function that adds a drawing to the card.

### Rooms

A room is a floor of tiles under a back wall. The floor is 16 tiles across (`c`, 0 to 15) and 6
down (`r`, 0 to 5). Each tile is 12 pixels.

```js
var WAREHOUSE = {
  bd: function (t) { K.roomTop({ acc: 'c', view: 'hills', wins: [[14, 34]], sign: ['BUYER CO', 96, 'c'] }, t); },
  hero: { who: 'buyer', c: 6, r: 4, tag: 'BUYER CO' },
  objs: [
    { id: 'desk', c: 2, r: 1, w: 3, draw: function (x, y) { K.tdesk(x + 1, y - 1, 34, { papers: 2 }); },
      on: function* () { yield G.say('', 'The contract. Clause 4: delivery by 1 June.'); } }
  ],
  actors: [
    { id: 'driver', who: 'driver', c: 9, r: 3, dir: 'l', tag: 'DRIVER',
      on: function* () { yield G.say('DRIVER', 'Sorry. The port was shut for seven days.'); } }
  ]
};
```

| Field | What it does |
|---|---|
| `bd` | Draws the backdrop: the wall and the floor |
| `hero` | The figure the player walks: `who` from the cast, a start tile, a `tag` shown over the head |
| `objs` | Things. `c`, `r` and `w` say which tiles a thing stands on. `draw(x, y)` draws it: `x` is the left edge of its first tile and `y` the foot of its row |
| `actors` | People. `dir` is the way they face: `'u'`, `'d'`, `'l'` or `'r'` |
| `on` | A script. Anything with an `on` can be talked to or looked at |
| `map` | Six strings of 16 characters. A `#` is a tile nobody can walk on |
| `over` | Draws on top of the room, after the people |
| `panel` | Draws in the panel while nobody speaks |

More settings for a thing: `tiles` lists the tiles it blocks if they are not a simple row, `touch`
lists the tiles from which it can be reached, `open: true` blocks nothing, `flat: true` draws it
under the people, `mx` and `my` move its mark. More settings for a person: `hidden: true`,
`solid: false`, `col` the tag colour, `armL` and `armR` (`'up'` or `'out'`), `keepDir: true` stops
the person turning to face the hero, `always: true` keeps the tag shown.

`yield* G.enter(room, hud)` opens the room. `yield G.free({ ... })` hands it to the player:

```js
yield* G.enter(WAREHOUSE, { date: '11 JUNE', place: 'BUYER CO\'S WAREHOUSE' });
yield G.free({ need: ['desk', 'driver'], goals: { desk: 'READ THE CONTRACT ON THE DESK', driver: 'ASK THE DRIVER WHAT HAPPENED' } });
```

The room ends when everything in `need` has been visited. A needed thing shows a `!`, anything else
with an `on` shows a grey `?` and may be skipped. `goals` is the line shown for each need.

Three smaller calls move people while the script has the room:

```js
yield G.walk('driver', 5, 3);        // walk a person to a tile
yield G.face('driver', 'u');         // turn a person
yield G.emote('hero', '!');          // a mark over a head for a moment
```

### Pictures

`yield* G.show(draw, hud)` puts a full-screen drawing up and keeps it while later steps play.

```js
yield* G.show(function (t) {
  r(0, 0, 192, 108, '6');                               // a pale ground
  K.sign(96, 8, 'DUE 1 JUNE. ARRIVED 11 JUNE.', 'k', 'w');
  K.who('buyer', 134, 102, { dir: 'l' });
}, { date: '1 JUNE', place: 'THE CONTRACT' });
yield G.say('', 'The pumps were due on 1 June.');
```

`t` is the time in seconds since the picture came up. Use it to move things. To change a picture
between lines, keep a value outside the drawing and change it in the script:

```js
var v = { lit: 0 };
yield* G.show(function (t) { if (v.lit) K.check(90, 50, 'C'); });
v.lit = 1; yield G.say('', 'Both sides accept.');
```

A third setting, `yield* G.show(draw, hud, true)`, gives a tall picture of 192 by 140 that covers
the panel. A tall picture has no text box. The end roll and the PLAY ALONG card are tall pictures.

### The status strip and the meter

Every `hud` in the calls above sets the status strip: `{ date: '11 JUNE', place: 'THE PORT', meter: 4000, note: '' }`.
Leave a field out and it keeps its value. `G.setHud({ place: 'THE OFFICE' })` changes it at any point.
The strip is narrow. When the date and the meter leave no room for the place, the place is left out.

The meter is one running number with a bar. Set it up in `config.js`:

```js
meter: {
  label: 'LATE FEE',                                        // the word beside the number
  cap: 20000,                                               // the bar is full here. Leave it out for no bar
  text: function (v) { return 'EUR ' + G.commas(v); }       // how the number is written
}
```

`yield* G.advance(date, value, place)` moves the date and counts the meter up or down to `value`.

```js
yield* G.advance('11 JUNE', 10000);          // the meter counts to 10,000
yield* G.advance('12 JUNE');                 // the date moves, the meter stays
yield* G.advance('1 JULY', null);            // the meter is hidden
```

`meter: null` in a `hud` hides the meter. `note` shows a few words in its place, for example a
daily rate before the count begins. Other meter settings: `col` the bar colour, `labelCol` the
label colour.

### Fights

A fight is a screen with two sides. `me` stands near and is seen from behind. `foe` stands far and
is seen from the front. Each side has a name, a label and a bar.

```js
yield* G.battle({
  theme: 'day',
  hud: { date: '11 JUNE', place: 'BY POST' },
  me: { who: 'buyer', name: 'BUYER CO', label: 'TRUST IN SELLER CO', f: 1, col: 'C' },
  foe: { who: 'seller', name: 'SELLER CO', label: 'TRUST IN BUYER CO', f: 1, col: 'b' },
  intro: 'The last payment to Seller Co is due today.'
}, function* (B) {
  yield G.shoot(B, 'me', 'notice'); yield G.hit(B, 'foe');
  yield G.say('BUYER CO', 'Notice: ten days late. We keep EUR 10,000.');
  yield G.bar(B, 'foe', 0.6);
});
```

`theme` is the backdrop: `day`, `sea`, `ice`, `grey`, `violet` or `dark`. `f` is the bar, from 0 to
1, and `col` its colour. A side is one of three kinds:

| Kind | How to write it |
|---|---|
| A person | `{ who: 'seller', ... }` |
| Two people | `{ kind: 'pair', pair: ['seller', 'driver'], ... }` |
| Anything you draw | `{ kind: 'draw', draw: function (x, y, t) { K.hq(x - 24, y + 3, 48, 38, { sign: 'SELLER CO' }); }, ... }` |

For a drawn side, `x` and `y` are the point where a person's feet would be. `allies: ['a', 'b']`
on `me` adds two smaller figures behind.

Inside the fight, `B` is the fight itself.

| Call | What happens |
|---|---|
| `yield G.shoot(B, 'me', kind, options)` | Something flies from one side to the other |
| `yield G.hit(B, 'foe')` | That side flinches. Add `true` for a harder hit |
| `yield G.bar(B, 'foe', 0.6)` | That side's bar moves to 60 per cent |
| `yield* G.swap(B, 'me', { who: 'director', name: 'THE DIRECTOR' })` | One side steps out and another steps in |
| `yield* G.flip(B, hud)` | The two sides change places, so the player takes the other chair |

The kinds of thing to throw: `chat` a message, `notice` an envelope with a red seal, `letter` a
plain envelope, `lock` a padlock, `call` a phone, `card` a card, `word` a sign with
`{ text: 'NO' }`, and `draw` with `{ draw: function (x, y) { ... } }` for a drawing of your own.
`c` in the options sets a colour.

To draw over the fight, give it a function: `B.over = function (t) { K.sign(40, 30, 'TRIED', 'k', 'w'); };`

### The end roll

`yield* G.roll(pages, settings)` shows pages that scroll, one at a time. Each page has a small
picture, a question in brackets, a claim and its reasons.

```js
var PAGES = [
  { part: 1, q: 'WHO BEARS THE TEN DAYS?', head: 'Share them. The port explains seven.',
    body: ['Clause 12 excuses delay outside a party\'s control.', 'Three days are left: a late fee of EUR 3,000.'],
    draw: function (t, y) { r(8, y, 176, 34, '6'); K.sign(96, y + 12, 'TEN DAYS', 'k', 'w'); } }
];
yield* G.roll(PAGES, { hud: { date: 'A PROPOSAL', place: '', meter: 10000 }, part: G.S.sub });
```

| Field | What it does |
|---|---|
| `q` | The question, in capitals. Pages that share a question share its heading in the story as text |
| `head` | The claim, shown first |
| `body` | The reasons, shown one after another |
| `draw` | A picture 176 wide and 34 high. Its top left corner is at (8, `y`) |
| `part` | A number that groups pages. `part` in the settings starts the roll at the first page of that part |
| `hud` | The status strip for this page, if it differs from the one in the settings |

The player pages forward with A or the right arrow and back with the left arrow. The builder stops
if a page holds more text than the screen.

### The title screen

The engine runs the title menu: START, CHAPTERS, PLAY ALONG if the story has a link, and AUTO. Your
part is the picture behind it, `drawTitle(t)`, drawn like any other picture.

```js
function drawTitle(t) {
  K.sky('cyan', 62); K.clouds(t, 'cyan'); K.sea(62, 46, t);
  G.bigTxt('LATE DELIVERY', 96, 8, 'k', 2, 'w');           // text, centre x, y, colour, size, shadow colour
  txt('AN INVENTED CASE', 96, 27, '1', { a: 'c' });
}
```

### The link and its code

Set `link` in `config.js` to the address where the game is published. Two things follow.

The title menu gains a PLAY ALONG entry. It opens a card with the QR code at the largest size that
fits, and the address in words. The engine lays the card out by itself.

`G.qr(x, y, options)` draws the same code wherever your title picture wants it:

```js
if (G.qr(191, 92, { anchor: 'br', frame: 'k' })) txt('SCAN TO PLAY', 181, 102, 'l', { a: 'r' });
```

`anchor` names the corner that sits at (`x`, `y`): `'tl'`, `'tr'`, `'bl'` or `'br'`. A longer
address makes a larger code, and an anchored code grows away from its corner. The call returns the
size it drew, or 0 if the story has no link, so the line above writes SCAN TO PLAY only when there
is a code.

Other options: `scale` pixels a module, `pad` white modules around the code, `frame` a colour for a
one pixel frame, `max` the most pixels a side the code may take.

The address may be up to 213 characters. Short is better: up to about 60 characters the card shows
the code at three pixels a module, which a phone reads from the back of a room.

### Timing and motion

| Call | What happens |
|---|---|
| `yield G.wait(0.5)` | Waits half a second |
| `yield G.tween(v, 'x', 100, 0.8)` | Moves the value `v.x` to 100 over 0.8 seconds. Add `true` for an even pace |
| `yield G.par([a, b])` | Runs several steps at once and waits for all of them |
| `yield G.call(function () { ... })` | Runs a line of your own as a step |
| `yield* G.fade(function () { ... })` | Changes the scene with a dissolve |
| `yield* G.wipe(function () { ... })` | Changes the scene with the flash and the bars that open a fight |

```js
var v = { x: 20 };
yield* G.show(function () { r(0, 0, 192, 108, '6'); K.crate(v.x, 60, 12, 10); });
yield G.par([G.tween(v, 'x', 150, 1.2), G.wait(0.4)]);
```

### Sound

`G.sfx(name)` plays a short sound. It is not a step, so it takes no `yield`.

```js
G.sfx('no');
```

The names: `tick` `next` `move` `ok` `no` `pop` `throw` `throw2` `hit` `hit2` `down` `up` `count`
`ring` `fight` `card` `key`. Most steps play their own sound already.

### Values and small helpers

| Name | What it is |
|---|---|
| `G.S` | The state of the game. Useful fields: `S.sub` the part an act was opened at, `S.hud` the status strip, `S.world` the room, `S.time` the clock in seconds |
| `G.S.vars` | An empty box for your own values. The engine empties it when the game restarts |
| `G.take('a')` | True once if the player has just pressed that button: `a`, `b`, `up`, `down`, `left`, `right` |
| `G.commas(10000)` | `'10,000'` |
| `G.wrap(text, 180, 'big')` | The text as lines no wider than 180 pixels |
| `G.bigTxt(text, cx, y, colour, size, shadow)` | Large lettering, centred on `cx` |
| `G.bigW(text, size)` | How wide that lettering is |
| `G.tag(cx, y, text, colour)` | A name tag |
| `G.link()` `G.linkText()` | The story's address, in full and as written on the card |
| `G.autoDue(t, letters)` | True when full auto play should move on, for a step you write yourself |

## Drawing

A scene is drawn with shapes, with pieces from the kit and with drawings of your own. Each example
can be pasted into a picture.

### Shapes and text

```js
var p = PX.p, r = PX.r, box = PX.box, ln = PX.ln, dash = PX.dash, disc = PX.disc, ring = PX.ring, txt = PX.txt, tw = PX.tw;

p(10, 10, 'k');                              // one pixel
r(10, 20, 40, 12, 'b');                      // a filled rectangle: x, y, width, height, colour
box(10, 20, 40, 12, 'k');                    // its outline
ln(10, 40, 60, 50, 'k');                     // a line from one point to another
dash(10, 55, 60, 55, 'X', 2, 2);             // a dashed line: 2 on, 2 off
disc(80, 30, 6, 'C'); ring(80, 30, 6, 'k');  // a filled circle and its outline
PX.poly([[100, 40], [120, 40], [110, 25]], 'L');     // a filled shape from its corners
PX.dith(0, 90, 192, 18, 'K', 2);             // a dither over a rectangle: 2 checker, 3 light, 4 sparse
txt('SMALL TEXT', 96, 60, 'k', { a: 'c' });  // text. a: 'c' centres it on x, 'r' ends it at x
txt('Larger text', 10, 70, 'k', { f: 'big' });       // the large font
var w = tw('SMALL TEXT');                    // how wide a text is, in pixels
```

The small font has capitals, digits and punctuation. The large font also has lower case. Neither
has accented letters. `PX.blit(rows, x, y)` draws a sprite from strings in which each character is
a palette key and a dot is clear.

### The kit

`var K = PX.kit;` gives the ready-made pieces. Positions are in pixels. `c` is always a colour.

**Skies and grounds**

| Piece | What it draws |
|---|---|
| `K.sky('cyan', 60)` | A sky down to the line y = 60. The kinds are `'cyan'` and `'periwinkle'` |
| `K.skies(60, 96, 20)` | Two skies meeting at x = 96, for two places in one picture |
| `K.clouds(t, 'cyan')` | Drifting clouds |
| `K.sea(60, 30, t)` | Sea from y = 60, 30 high. Two more numbers limit it from one x to another |
| `K.coast(80, t)` | A strip of sea, then green land |
| `K.snow(80)` | Snow |
| `K.hills(60)` | A row of green hills with their foot at y = 60 |
| `K.plaza(93)` | A paved strip along the foot of the scene |

**Buildings**

| Piece | What it draws |
|---|---|
| `K.hq(x, base, w, h, { acc: 'b', sign: 'SELLER CO', flag: 'b' })` | An office building |
| `K.shed(x, base, w, h, 'C')` | A shed with a coloured roof |
| `K.crane(x, base)` | A port crane |
| `K.crowd(x0, x1, base, n, seed)` | A row of people seen from behind |

**Rooms**

| Piece | What it draws |
|---|---|
| `K.roomTop({ acc, view, wins, floor, wall, sign, doors }, t)` | The backdrop of a room to walk in. `wins` is a list of `[x, width]`. `view` is what the windows show: `'sea'`, `'hills'`, `'towers'` or `'spires'` |
| `K.floor('5', '6')` | Only the tiled floor: its colour and the colour of the joints |
| `K.floorPart(0, 96, 'J', 'I')` | The floor over part of the width, for two rooms on one screen |
| `K.tdesk(x, yb, w, { papers: 2, screen: 'e', phone: 'C' })` | A desk |
| `K.ttable(x, yb, w, depth)` | A meeting table |
| `K.tbox(x, yb, w, 'b', 'L', 'LABEL')` | A large ribbed box, such as a shipping container |
| `K.tplant(x, yb)` | A plant in a pot |
| `K.block(x, yb, w, depth, h, top, front)` | A plain block, to build furniture of your own |
| `K.room({ acc, wins, view })` | A room seen from the side, for a picture |
| `K.view(x, y, w, h, 'towers')` | One window |

In a room, `yb` is the foot of a row. A thing's `draw(x, y)` receives it as `y`.

**Papers and props**

| Piece | What it draws |
|---|---|
| `K.sign(cx, y, 'TEXT', 'k', 'w')` | A sign: ground colour, then text colour |
| `K.money(cx, y, 'EUR 1,000', 'X')` | A value in a white box with a coloured edge |
| `K.plate('LABEL', 'k', x, y)` | A plain label |
| `K.cal(x, y, '11 JUNE', '2026', 'X')` | A calendar leaf |
| `K.bar(x, y, w, h, 0.5, 'X')` | A bar filled to a fraction |
| `K.paper(x, y, w, h)` | A sheet with lines |
| `K.letter(x, y, w, h, { acc: 'b', head: 'NOTICE', seal: 1 })` | A letter |
| `K.env(x, y, 'X')` | An envelope. `'X'` gives it a red seal |
| `K.chat(x, y, 16, 'C')` | A chat message |
| `K.bubble(x, y, w, h)` | An empty speech bubble |
| `K.phone(x, y, 'e')` | A phone |
| `K.padlock(x, y, '3')` | A padlock |
| `K.key(x, y, 2)` | A key in four pieces. The number says how many are cut |
| `K.safe(x, y, w, h)` | A safe |
| `K.crate(x, y, w, h)` | A wooden crate |
| `K.coins(x, y, 3)` | A stack of coins |
| `K.folder(x, y, w, h, 'N')` `K.book(x, y, w, h)` | A folder and an open book |
| `K.clock(cx, cy, 7, 3, 30)` | A clock at half past three |
| `K.gavel(x, y)` `K.stamp(x, y)` `K.seal(x, y, 'C')` `K.pin(x, y, 'X')` `K.flag(x, y, 'b', t)` | Small props |
| `K.desk(x, y, w)` `K.chair(x, y)` `K.monitor(x, y, w, h)` | Furniture seen from the side |
| `K.check(x, y, 'C')` `K.cross(x, y, 'X')` | A tick and a cross |
| `K.arrow(x0, y0, x1, y1, 'k')` | An arrow. Add `true` for a dashed one |
| `K.dots(x, y, t)` | Three dots that come and go |
| `K.mark(cx, y, t, 'k', '!')` | The bouncing mark of a room |

**People**

| Piece | What it does |
|---|---|
| `K.addCast({ name: { hair, hc, skin, top, det, pants } })` | Adds people to the cast |
| `K.who('buyer', cx, feetY, { dir: 'l' }, 'NAME')` | A person with a shadow and, if you give one, a name tag |
| `K.fig('buyer', cx, feetY, { dir: 'r', armR: 'up' })` | A person with no shadow |
| `K.big('buyer', cx, feetY, 2)` | A person enlarged two or three times |
| `K.ghost('buyer', cx, feetY)` | A pale outline of a person |
| `K.shadow(cx, feetY)` | A shadow |

A cast entry: `hair` is `short`, `bob`, `long`, `fade`, `bun`, `bald`, `cap` or `curly`. `hc` is
the hair colour. `skin` is `'s'`, `'S'`, `'d'` or `'M'`. `top`, `det` and `pants` are the jacket,
the collar and the trousers. `gl: 1` adds glasses, `coat: 1` a long coat, `robe: 1` a robe. A
person's options: `dir`, `walk` (a step number), `sit: 1`, `armL` and `armR` (`'up'` or `'out'`),
`blink: 1`.

**Small helpers**

`K.ease(a, b, t)` rises smoothly from 0 to 1 while `t` goes from `a` to `b`. `K.bob(t)` swings
between -1 and 1, for things that float. `K.ellipse(cx, cy, rx, ry, c)` and
`K.halfring(cx, cy, radius, c)` draw those shapes. A fight backdrop of your own is one line:
`K.arenas.mine = { sky: ['G', 'I', 'J', 'w'], ground: ['J', 'I'], pad: ['w', 'G'] };`

### Drawings of your own

A drawing of your own is a function built from the shapes above. Put it in `art.js` if several
scenes use it. The starter's truck is the whole method:

```js
function truck(x, y) {
  r(x, y - 9, 14, 8, 'w'); box(x, y - 9, 14, 8, 'k');         // the load
  r(x + 14, y - 6, 6, 5, 'b'); box(x + 14, y - 6, 6, 5, 'k'); // the cab
  r(x + 2, y - 1, 3, 2, 'k'); r(x + 14, y - 1, 3, 2, 'k');    // two wheels
}
```

`stories/baltic-nusantara/art.js` has larger ones: a cargo ship, a quay, a customs gate.

## Code of your own

The engine covers what most cases need. When your case needs something else, write it in your
story. The example story does this once. In its two private rooms the mediator hears what each side
will allow her to pass on. Each item pops up as a card, then flies either into a bag under the room
or onto the wall.

The engine has no bag. The story builds it from three hooks every room offers (`bd`, `over` and
`panel`), a list of its own, and `G.tween`. Search `story.js` in that folder for "THE BAG" to read
it.

## Checks

The builder plays your story before it writes the file. It stops and names the fault if:

- a route does not reach the end, or stands still for thirty seconds
- a room asks for something that has no `on`
- a text box needs more than two lines
- a menu option or a menu title is too wide, or a menu has too many options
- a text uses a character the font lacks
- a text runs off the edge of the screen
- a pixel is left unpainted or has a colour outside the palette
- an end roll page holds more than the screen
- a colour you added is warm
- the link is too long for a QR code

Two commands help while you write. The first plays the record and saves pictures of every scene to
a folder. The second plays one act only. Acts count from 0 in this command, so `--act=1` is the
second act.

```
node tools/play.js stories/my-case --out=.scratch/sheets
node tools/play.js stories/my-case --act=1 --fast
```

Look at the pictures. The builder cannot see a figure standing in front of a sign or two labels
that touch.

**Checks of your own.** A `checks.js` in your story folder runs after the engine's checks. It
presses buttons, lets time pass and looks at the state:

```js
const T = require('../../tools/lib.js').harness(__dirname), { G, S, ok, until } = T;
G.start(0);                                                              // open the first act
ok('the fee stands at 10,000 after the picture', until(() => S.hud.meter === 10000, 5000, 'next'));
T.done();
```

`until(test, ticks, button)` lets the game run until the test is true, pressing the button on the
way. `'next'` is the N key. `stories/baltic-nusantara/checks.js` is a fuller example.

## Faithful to the source

The engine cannot check your facts. These habits keep a story honest:

- Every fact on screen comes from your source. If the source does not say it, the story does not show it.
- A choice may offer a move a party did not make. Answer it with a line from the source, then play the record.
- Mark your own analysis as yours. The example puts GROUP 7 PROPOSES in the status strip on the pages of its end roll that hold the group's proposal.
- Stop where the source stops. If it gives no outcome, the story has none.
