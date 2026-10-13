/* story.js: the starter story. Copy this folder, then change it into your own case.

   THE CASE IN THIS FILE IS INVENTED. Seller Co owed Buyer Co forty pumps by 1 June. They came on 11 June.
   The contract has a late fee. Buyer Co kept part of the price. That is all there is to it, and none of it is real.

   The story is about one minute long and uses each thing the engine offers once:
     1. the cast            who appears, and what they wear
     2. the title picture   what is behind the title menu
     3. a room              walk, talk, two things to find
     4. a fight             a choice with a move on the record, things thrown, two bars
     5. a picture           a full-screen drawing, with the meter in the status strip counting up
     6. the end roll        two pages: a question, a claim, the reasons
     7. the acts            the order in which all of this plays

   How to read it. Words between quote marks appear on screen: change them freely.
   Single letters between quote marks, such as 'b' or 'X', are colours. Numbers are positions in pixels:
   the scene is 192 wide and 108 high, x runs from the left and y from the top.
   A line that starts with two slashes is a note to you. docs/STORY-GUIDE.md explains every piece used here. */
(function () {
  // Short names for what this file uses most. Leave these two lines as they are.
  var r = PX.r, box = PX.box, dash = PX.dash, txt = PX.txt, K = PX.kit, S = G.S;
  var say = G.say, menu = G.menu, free = G.free;

  // ================================================================ 1. the cast
  // One line a person. The name on the left is how the rest of this file refers to them.
  // hair: short, bob, long, fade, bun, bald, cap, curly.   hc: hair colour.   skin: 's', 'S', 'd' or 'M'.
  // top: the jacket.   det: the collar and tie.   pants: the trousers.   gl: 1 gives glasses.
  // Here colour follows the party: Seller Co wears blue ('b', 'L'), Buyer Co wears teal ('c', 'C').
  K.addCast({
    buyer: { hair: 'bob', hc: 'k', skin: 's', top: 'C', det: 'w', pants: '1' },            // Buyer Co's warehouse manager: the player
    driver: { hair: 'cap', hc: 'b', skin: 'S', top: 'L', det: 'w', pants: '1' },           // Seller Co's driver
    seller: { hair: 'short', hc: '2', skin: 'd', top: 'b', det: 'w', pants: 'k', gl: 1 }   // Seller Co's director
  });

  // ================================================================ 2. the title picture
  // The engine calls this many times a second. t is the time in seconds, which is what makes things move.
  // Everything is drawn back to front: the sky first, the lettering last.
  function truck(x, y) {                                    // a drawing of your own is a few rectangles: r(x, y, width, height, colour)
    r(x, y - 9, 14, 8, 'w'); box(x, y - 9, 14, 8, 'k');     // the load
    r(x + 14, y - 6, 6, 5, 'b'); box(x + 14, y - 6, 6, 5, 'k');   // the cab
    r(x + 2, y - 1, 3, 2, 'k'); r(x + 14, y - 1, 3, 2, 'k');      // two wheels
  }
  function drawTitle(t) {
    K.sky('cyan', 62); K.clouds(t, 'cyan'); K.hills(62, 0, 128);                           // sky, drifting clouds, hills
    r(0, 62, 128, 30, 'i'); r(0, 62, 128, 1, 'h');                                         // the land
    K.sea(62, 30, t, 128, 192); r(126, 62, 2, 30, '5'); K.crane(136, 70);                  // the port: sea, a quay wall, a crane
    K.hq(6, 80, 46, 30, { acc: 'b', sign: 'SELLER CO', flag: 'b' });                       // two office buildings
    K.hq(70, 80, 46, 30, { acc: 'c', sign: 'BUYER CO', flag: 'c' });
    r(0, 80, 128, 8, '5'); r(0, 80, 128, 1, 'w'); dash(0, 84, 127, 84, 'w', 3, 3);          // the road between them
    truck(8 + ((t * 7) % 84), 88);                                                         // the pumps on their way, again and again
    G.bigTxt('LATE DELIVERY', 96, 8, 'k', 2, 'w');                                         // the title: text, centre x, y, colour, size, shadow
    txt('AN INVENTED CASE IN TWO SHORT ACTS', 96, 27, '1', { a: 'c' });
    r(0, 92, 192, 16, 'a'); r(0, 92, 192, 1, 'K');                                         // the dark band at the foot
    txt('A STARTER STORY: COPY IT, THEN MAKE IT YOURS', 96, 95, '4', { a: 'c' }); txt('EVERY FACT HERE IS INVENTED', 11, 102, '3');
    // If config.js gives a link, this draws its QR code with its corner on the band, over the sea. With no link it draws nothing.
    if (G.qr(191, 92, { anchor: 'br', frame: 'k' })) txt('SCAN TO PLAY', 181, 102, 'l', { a: 'r' });
  }

  // ================================================================ 3. the room
  // A room is a floor of tiles, 16 across (c, 0 to 15) and 6 down (r, 0 to 5), under a back wall.
  // It has a backdrop (bd), a hero, things (objs) and people (actors). Anything with an "on" can be talked to.
  var WAREHOUSE = {
    bd: function (t) { K.roomTop({ acc: 'c', view: 'hills', wins: [[14, 34], [144, 34]], floor: ['I', 'J'], sign: ['BUYER CO', 96, 'c'] }, t); },
    hero: { who: 'buyer', c: 6, r: 4, tag: 'BUYER CO' },
    objs: [
      // The desk. It stands on tiles 2 to 4 of row 1. Talking to it reads the contract: this is where your facts go.
      { id: 'desk', c: 2, r: 1, w: 3, draw: function (x, y) { K.tdesk(x + 1, y - 1, 34, { papers: 2, screen: 'e' }); },
        on: function* () {
          yield say('', 'The contract. Clause 4: delivery by 1 June.');
          yield say('', 'Clause 9: a late fee of EUR 1,000 for each day.');
        } },
      // The crates. Nothing in the story needs them, so they get a grey "?" and may be skipped.
      { id: 'crates', c: 11, r: 2, w: 3, draw: function (x, y) { K.tbox(x + 2, y - 1, 32, 'b', 'L', 'PUMPS'); },
        on: function* () { yield say('', 'Forty pumps. They came today, 11 June.'); } },
      { id: 'more', c: 14, r: 1, w: 2, draw: function (x, y) { K.tbox(x + 1, y - 1, 22, '3', '4'); } },      // no "on": only furniture
      { id: 'plant', c: 0, r: 0, w: 1, draw: function (x, y) { K.tplant(x, y); } }
    ],
    actors: [
      { id: 'driver', who: 'driver', c: 9, r: 3, dir: 'l', tag: 'DRIVER',
        on: function* () { yield say('DRIVER', 'Sorry. The port was shut for seven days.'); } }
    ]
  };

  // ================================================================ 4. the fight
  // Two sides face each other. "me" is seen from behind, "foe" from the front. Each has a name, a label and a bar (f, from 0 to 1).
  // A side is a person from the cast (who), or anything you draw: here the other side is Seller Co's head office.
  function* fight() {
    yield* G.battle({
      theme: 'day',                                                                        // the backdrop: day, sea, ice, grey, violet or dark
      hud: { date: '11 JUNE', place: 'BY POST' },                                          // the status strip over the scene
      me: { who: 'buyer', name: 'BUYER CO', label: 'TRUST IN SELLER CO', f: 1, col: 'C' },
      foe: { kind: 'draw', draw: function (x, y) { K.hq(x - 24, y + 3, 48, 38, { acc: 'b', sign: 'SELLER CO', flag: 'b' }); },
        name: 'SELLER CO', label: 'TRUST IN BUYER CO', f: 1, col: 'b' },
      intro: 'The last payment to Seller Co is due today.'
    }, function* (B) {
      // A choice. canon is the move on the record, counted from 0: here the second option.
      // The N key always plays that move. The other option gets one line in reply, then the record plays.
      var i = yield menu('BUYER CO: HOW TO RAISE IT', ['A PHONE CALL', 'A FORMAL NOTICE'], { canon: 1, col: 'c' });
      if (i === 0) yield say('', 'On the record, nobody called. Buyer Co wrote.');
      yield G.shoot(B, 'me', 'notice'); yield G.hit(B, 'foe');                             // an envelope flies across, the other side flinches
      yield say('BUYER CO', 'Notice: ten days late. We keep EUR 10,000.');
      yield G.bar(B, 'foe', 0.6);                                                          // Seller Co's bar drops to 60 per cent
      yield G.shoot(B, 'foe', 'letter'); yield G.hit(B, 'me');
      yield say('SELLER CO', 'The port was shut. Clause 12 excuses that.');
      yield G.bar(B, 'me', 0.6);
      yield say('', 'Each side now reads the contract its own way.');
    });
  }

  // ================================================================ 5. a full-screen picture, with the meter
  // G.show takes a drawing and keeps it on screen while the lines below it play.
  // The meter is set up in config.js. G.advance moves the date and counts the meter up to a new value.
  function* tenDays() {
    yield* G.show(function (t) {
      var days = Math.floor((S.hud.meter || 0) / 1000), i;                                 // the boxes fill as the meter climbs
      r(0, 0, 192, 108, '6'); r(0, 0, 192, 3, 'k'); r(0, 86, 192, 22, '5'); r(0, 86, 192, 1, '3');     // a pale wall, an ink stripe, a floor
      K.sign(96, 8, 'DUE 1 JUNE. ARRIVED 11 JUNE.', 'k', 'w');
      for (i = 0; i < 10; i++) {                                                           // ten boxes, one for each day from 2 to 11 June
        r(27 + i * 14, 28, 12, 14, i < days ? 'X' : 'w'); box(26 + i * 14, 27, 14, 16, 'k');
        txt(String(i + 2), 33 + i * 14, 33, i < days ? 'w' : '3', { a: 'c' });
      }
      txt('JUNE', 96, 47, '2', { a: 'c' });
      K.money(96, 58, 'EUR 1,000 FOR EACH DAY', 'X');
      K.tbox(80, 100, 32, 'b', 'L', 'PUMPS'); K.who('driver', 58, 102, { dir: 'r' }); K.who('buyer', 134, 102, { dir: 'l' });
    }, { date: '1 JUNE', place: '', meter: 0 });                                              // the status strip: a date, no place, the meter at 0
    yield say('', 'The pumps were due on 1 June.');
    yield* G.advance('11 JUNE', 10000);                                                    // the new date, and the value the meter counts up to
    yield say('', 'Ten days at EUR 1,000. Buyer Co kept EUR 10,000.');
    yield say('', 'Seller Co says seven of those days were the port\'s.');
  }

  // ================================================================ 6. the end roll
  // One entry a page. q is the question (capitals), head the claim, body the reasons, draw a small picture
  // 176 wide and 34 high whose top left corner is at (8, y). part groups the pages: here one page a question.
  // Keep to what your source says. If a page is your own proposal, say so on the page, as the second one does.
  var PAGES = [
    { part: 1, q: 'WHO BEARS THE TEN DAYS?', head: 'Share them. The port explains seven.',
      body: ['Clause 12 excuses delay outside a party\'s control.', 'Three days are left: a late fee of EUR 3,000.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); txt('THE TEN DAYS', 96, y + 3, '2', { a: 'c' });
        for (var i = 0; i < 10; i++) { r(28 + i * 14, y + 11, 12, 9, i < 7 ? '4' : 'X'); box(27 + i * 14, y + 10, 14, 11, 'k'); }
        txt('7: THE PORT WAS SHUT', 76, y + 25, '2', { a: 'c' }); txt('3: THE FEE', 146, y + 25, 'X', { a: 'c' });
      } },
    { part: 2, q: 'AND NEXT TIME?', head: 'Call first. Then write.',
      body: ['This is our proposal. None of it has happened.', 'The case is invented, to show how a story is built.'],
      draw: function (t, y) {
        r(8, y, 176, 34, '6'); r(8, y + 29, 176, 5, '5');
        K.sign(74, y + 3, 'FIRST A CALL', 'c', 'w'); K.arrow(103, y + 7, 111, y + 7, 'k'); K.sign(147, y + 3, 'THEN THE LETTER', 'k', 'w');
        K.fig('buyer', 26, y + 33, { dir: 'r', armR: 'up' }); K.phone(36, y + 12, 'e');
        K.chat(58 + Math.round(((t * 0.5) % 1) * 40), y + 17, 16, 'C');                    // a message crossing over, again and again
        K.letter(128, y + 15, 14, 17, { acc: 'k' }); K.fig('seller', 164, y + 33, { dir: 'l' });
      } }
  ];

  // ================================================================ 7. the acts
  // An act is a list of steps, played in order. "yield" means: do this, and wait until it is over.
  function* act1() {
    // A title card. plain is the same text in ordinary writing, for the story as text under the game.
    yield* G.card({ kicker: 'ACT 1', title: 'THE DELIVERY', sub: 'BUYER CO\'S WAREHOUSE, 11 JUNE',
      note: 'AN INVENTED CASE. SELLER CO OWED FORTY PUMPS BY 1 JUNE. THEY HAVE JUST COME.', acc: 'e',
      plain: 'Buyer Co\'s warehouse, 11 June. An invented case. Seller Co owed forty pumps by 1 June. They have just come.' });
    yield* G.enter(WAREHOUSE, { date: '11 JUNE', place: 'BUYER CO\'S WAREHOUSE', meter: null });      // into the room
    yield say('', 'You run the warehouse at Buyer Co.');
    // The player now walks. The room ends when both needs are met. goals is the line shown for each.
    yield free({ need: ['desk', 'driver'], goals: { desk: 'READ THE CONTRACT ON THE DESK', driver: 'ASK THE DRIVER WHAT HAPPENED' } });
    yield G.emote('hero', '!');
    yield say('BUYER CO', 'Ten days late. Seller Co must be told.');
    yield* fight();
    yield* tenDays();
  }
  function* act2() {
    yield* G.card({ kicker: 'ACT 2', title: 'A PROPOSAL', sub: 'TWO QUESTIONS',
      note: 'FROM HERE ON: WHAT WE WOULD PROPOSE. NONE OF IT HAS HAPPENED.', acc: 'l',
      plain: 'Two questions. From here on: what we would propose. None of it has happened.' });
    yield* G.roll(PAGES, { hud: { date: 'A PROPOSAL', place: '', meter: 10000 } });
  }

  // menu is the name in the chapter list, heading the name in the story as text.
  G.story({
    drawTitle: drawTitle,
    acts: [
      { menu: '1 THE DELIVERY', heading: 'Act 1: the delivery', run: act1 },
      { menu: '2 A PROPOSAL', heading: 'Act 2: a proposal', run: act2 }
    ]
  });
})();
