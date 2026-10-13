/* config.js: the words around the game and its settings. The scenes are in story.js, this case's drawings in art.js. */
G.config({
  // ---- the page around the game
  id: 'baltic-nusantara',                                   // a short name with no spaces. The page remembers the sound setting under it
  title: 'Baltic v Nusantara: the mediation',               // the browser tab and the heading over the game
  kicker: 'Group 7 · International Dispute Resolution',     // the small line above the heading
  lede: 'The case as a short pixel game: three acts, then the memo\'s four answers as a closing roll. Walk, talk and choose the next step. Press <kbd>N</kbd> at any point to play what the record says.',
  foot: 'Acts 1 to 3 follow the facts of the Group 7 mediation memo and, for March 2026, the negotiation memo. The closing roll is the group\'s proposal and nothing in it has happened. The case is an illustrative reconstruction: names, dates, figures and clause wording are fictional.',

  // ---- the title screen
  menuTitle: 'BALTIC V NUSANTARA',                          // the label on the title menu
  link: 'https://group-7-game-mediation.vercel.app',        // where the game is published. The engine turns it into the QR code and the PLAY ALONG card

  // ---- the colour of each speaker's name on the text box
  speakers: { RIZKY: 'c', 'PAK HENDRA': 'c', NUSANTARA: 'c', DMITRI: 'b', BALTIC: 'b', LEGAL: 'b', 'TIRTA WATER': 'v', SIMC: 'k', 'THE MEDIATOR': 'k', CUSTOMS: '2', DOCKER: '2' },

  // ---- the meter in the status strip: Tirta Water's charge, USD 15,000 a day up to a cap of USD 750,000
  meter: {
    label: 'CHARGE',
    cap: 750000,                                                                          // the bar is full here
    text: function (v) { return 'USD ' + G.commas(Math.round(v / 1000) * 1000); }         // how the value is written
  },

  // ---- the story as text under the game. Words on screen are in capitals; these keep their own spelling when written out
  transcript: {
    keep: { SIAC: 'SIAC', SIMC: 'SIMC', USD: 'USD', 'ARB-MED-ARB': 'Arb-Med-Arb', WHATSAPP: 'WhatsApp', BALTIC: 'Baltic', 'BALTIC:': 'Baltic:', NUSANTARA: 'Nusantara', 'NUSANTARA:': 'Nusantara:',
      'RIZKY:': 'Rizky:', "BALTIC'S": "Baltic's", OCTOBER: 'October' }
  }
});
