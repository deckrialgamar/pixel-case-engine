/* config.js: the words around the game, and its settings.

   Start here. Change the words between the quote marks and leave the rest of each line as it is.
   A line that starts with two slashes is a note to you. The game ignores it.
   The scenes themselves are in story.js. */
G.config({

  // ---- the page around the game -------------------------------------------------------------
  id: 'starter',                                      // a short name, no spaces. The page remembers the sound setting under it
  title: 'Seller Co v Buyer Co: the late delivery',   // the browser tab and the heading over the game
  kicker: 'A starter story · every fact is invented', // the small line above the heading. Delete the line if you want none
  lede: 'An invented case as a one-minute pixel game. Walk, talk and choose the next step. Press <kbd>N</kbd> at any point to play what the record says.',
  foot: 'This case is invented to show how a story is built. Seller Co, Buyer Co, the dates, the sums and the clauses do not exist.',

  // ---- the title screen ---------------------------------------------------------------------
  menuTitle: 'SELLER CO V BUYER CO',                  // the label on the title menu. Capitals only: the small font has no lower case

  // Where your game will be published, if anywhere. Give the full address, for example 'https://my-case.example.org'.
  // The engine then makes a QR code from it, puts it on the title screen where story.js asks for it,
  // and adds a PLAY ALONG card to the title menu. Leave it empty and there is no code and no card.
  link: '',

  // ---- the colour of each speaker's name on the text box -------------------------------------
  // The name must be written exactly as story.js writes it. The letters are colours from the palette:
  // 'b' blue, 'c' teal, 'v' violet, 'n' indigo, 'g' green, 'k' ink, '2' grey-blue. The guide lists them all.
  speakers: { 'BUYER CO': 'c', 'SELLER CO': 'b', DRIVER: 'b' },

  // ---- the meter in the status strip ---------------------------------------------------------
  // One running number that your story moves with G.advance(date, value). Here it is the late fee.
  // Delete the whole meter block if your story has no such number.
  meter: {
    label: 'LATE FEE',                                              // the word beside the number
    cap: 20000,                                                     // the bar is full at this value. Leave cap out for a number with no bar
    text: function (v) { return 'EUR ' + G.commas(v); }             // how the number is written: EUR 10,000
  },

  // ---- the story as text, under the game -----------------------------------------------------
  // The builder writes the whole story out as plain text for readers who cannot use the game.
  // On screen everything is in capitals. List here the words that must keep their own spelling when written out.
  transcript: {
    keep: { EUR: 'EUR', SELLER: 'Seller', BUYER: 'Buyer', CO: 'Co', 'CO:': 'Co:', JUNE: 'June' }
  }
});
