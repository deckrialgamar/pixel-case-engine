# Pixel case engine

Turn a case study into a short pixel-art game. The player walks through the facts, makes the
choices the parties made and reads your analysis at the end. The result is one HTML file that opens
in any browser, with no installation and no internet connection.

You write the story. The engine supplies the rooms, the text box, the choices, the fight screen,
the end roll, the menus, the sound and the checks.

## What you need

- Python 3 and Node.js on your computer. Both are free. Nothing else is installed or downloaded.
- A source for your case: a memo, a judgment, a problem question.
- No programming experience. You change words and numbers in two files.

## A first build

Open a terminal in this folder and run:

```
python3 -I build.py stories/starter dist/starter.html
```

Open `dist/starter.html` in a browser. That is the starter story: an invented case about a late
delivery, about one minute long.

The same command builds the full example:

```
python3 -I build.py stories/baltic-nusantara dist/baltic-nusantara.html
```

The builder refuses to replace a file that already exists. Give a new name, or add `--force`.

## Your own story

1. Copy the folder `stories/starter` and give the copy a name, for example `stories/my-case`.
2. Open `config.js` in the copy. Change the title, the lines of text around the game and the meter.
3. Open `story.js`. Change the cast, the room, the lines people say, the choice and the end roll.
   Every block has a note that says what it does.
4. Build it: `python3 -I build.py stories/my-case dist/my-case.html`.
5. Read what the builder prints. If it stops, it names the line of text or the scene at fault.

`docs/STORY-GUIDE.md` explains every piece you can use. `docs/BRIEF-TEMPLATE.md` is a brief you
can fill in and give to an AI assistant together with your source, if your course allows that.

## What a story can hold

| Piece | What the player does |
|---|---|
| Title screen | Starts the story, picks an act, switches auto play on |
| Card | Reads the name of an act |
| Room | Walks, talks to people, looks at things, until the goals are met |
| Text box | Reads two short lines at a time |
| Choice | Picks a move. One option is the move on the record, and the N key always plays it |
| Fight | Faces the other side. Messages and notices fly across, and two bars move |
| Picture | Watches a full-screen drawing while the lines play |
| Meter | Follows one running number in the status strip, such as a fee or a deadline |
| End roll | Pages through your analysis: a question, a claim, the reasons, a small picture |

Some things come with every story and need no work from you. The whole story is written out as
plain text under the game, for readers who cannot play it. Auto play walks and chooses for a
presenter whose keys fail. If you give the story a web address, the engine draws its QR code and
adds a PLAY ALONG card so a class can open the game on their phones.

## What the builder checks

Before it writes the file, the builder plays the story from start to end without a browser. It
plays the moves on the record, then random moves, then both levels of auto play, then every act on
its own. It stops if any route fails to reach the end.

It also stops for a line too long for the text box, a menu option too wide, a letter the pixel font
lacks, text that runs off the screen, a pixel left unpainted and a colour outside the palette.

To test the finished page in a real browser, see the note at the top of `tools/chrome.js`.

## What is in this folder

```
engine/                  the engine. A story never needs to change it
  engine.js              the pixel renderer and the palette
  kit.js                 the drawing kit: skies, rooms, furniture, papers, people
  qr.js                  the QR code encoder
  game.js                rooms, text, choices, fights, the end roll, the menus
  font.json              the two pixel fonts
  shell.html             the page around the game
build.py                 makes one HTML file from one story
tools/
  play.js                plays a story without a browser and checks it
  menus.js               checks the menus, the pointer and auto play
  chrome.js              tests a built page in headless Chrome
  lib.js                 what the three tools share
stories/
  starter/               the story to copy
  baltic-nusantara/      the full example
docs/
  STORY-GUIDE.md         how to write a story
  BRIEF-TEMPLATE.md      a brief for an AI assistant
```

## The example story

`stories/baltic-nusantara` is a class project by Group 7: a mediation between a supplier and its
distributor, told in three acts and an end roll. It is an illustrative reconstruction. Names,
dates, figures and clause wording are fictional. It uses every piece in the table above and adds
drawings and one mechanism of its own, so it is the place to look when the starter is too small.

## Limits

- The screen is 192 by 108 pixels and the text box holds two short lines. Long passages do not fit.
- The pixel fonts cover English letters, digits and common punctuation. They have no accented
  letters. The small font has capitals only.
- The engine's own menu words are in English.
- Every colour is cool-toned by rule. The builder rejects a colour whose red is not below its blue.
- A room is one screen. There is no scrolling map.
