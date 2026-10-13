# Brief template

A brief you can fill in and give to an AI assistant, together with your source and this
repository. The assistant then writes the story folder and you check it against your source.

**Before you start.** Check the rules of your course on AI tools. Some courses do not allow them in
assessed work. The facts and the analysis must be yours and your source's. The assistant arranges
them into scenes.

**How to use it.** Replace everything in square brackets. Delete what does not apply. Keep the
fidelity rules as they are: they are the part that protects you. Attach your source in full.

---

## Role

You are a game designer and pixel artist who builds short story games, and a teacher of
[your subject, for example contract law or dispute resolution]. You are fair to every party. You
teach the case to someone who has not read the source.

## Task

Write one story for the pixel case engine in this repository. Read `docs/STORY-GUIDE.md` and
`stories/starter` first, and `stories/baltic-nusantara` for a full example.

Copy `stories/starter` to `stories/[short-name]` and change it into this case:
[one sentence that names the parties, the dispute and the period, for example "the dispute between
Seller Co and Buyer Co over a late delivery, from the contract of 1 March to the notice of 12 June"].

The story then presents [what comes after the facts, for example "our group's answers to the three
questions set" or "nothing: the story ends where the facts end"].

It should take [five to eight] minutes to play. Every act opens directly from the chapter list.

## The source

- The only source for the facts is [the attached document, with its date].
- [A second source, and exactly which part of the story it covers. Delete if there is none.]
- The questions to answer, if any: [paste them word for word].

## The one idea

[One or two sentences on what the player should understand at the end. Not a summary of the case.
Example: "For three acts the two sides face each other while a deadline runs against both. The
proposal begins when they are asked to face it together."]

## Fidelity rules

1. Every fact on screen comes from the source. If the source does not say it, the story does not
   show it. Do not invent names, dates, sums, places, clause wording or motives.
2. Name only the people the source names. Everyone else is a role: counsel, the director, the
   mediator.
3. A choice may offer a move a party did not make, but only where the source supplies the line that
   answers it. The move on the record then plays. The story never leaves the record.
4. Facts and proposals are kept apart. The acts are facts. Anything that is our own analysis or
   proposal is labelled as a proposal on the screen where it appears.
5. No outcome that the source does not state. If the source stops before the end of the dispute,
   the story stops there too and says what is still open.
6. Every party gets its reasons. If the source gives a party's reason for a step, show it.
7. Arithmetic is allowed only where the source gives the inputs: [list the sums you permit, or
   write "none"].
8. Leave out: [citations you have not checked, terms you do not want on screen, names of group
   members, anything else].
9. Every line of an end roll page is a sentence of [the part of the source that holds the analysis],
   shortened. Keep a table of each line and the paragraph it comes from, so that it can be checked.

When the source is silent or unclear on something a scene needs, do not fill the gap. List the
question for me and leave the scene out until I answer.

## How it plays

The engine gives these pieces: a room to walk in, a text box of two short lines, a choice with a
move on the record, a fight screen for a decision between two sides, a full-screen picture, a meter
in the status strip, and an end roll of pages. One key always plays the next step on the record, so
a presenter needs nothing else.

Use this outline. [Change the rows. Two to four acts is usual.]

| Act | Where and when | The player is | What happens |
|---|---|---|---|
| 1 [name] | [place and date] | [a person or role in the source] | [the events, the choice if any, which piece shows them] |
| 2 [name] | | | |
| 3 [name] | | | |
| End roll | | | [one to four pages for each question: a claim and its reasons] |

- The meter: [the one number that runs through the case, how it is worked out and its limit. Example:
  "the late fee, EUR 1,000 for each day after 1 June, capped at EUR 20,000". Or "none".]
- Fights: use one only where two sides decide against each other. [Say which decisions.] A bar may
  move only at an event in the source. Nothing is won unless the source says who won.
- Text: no paragraph anywhere. One thought to a text box.

## Look

- Colour follows the case: one palette colour for each party, kept through every scene.
  [Party A] is [blue], [Party B] is [teal], [a third party] is [violet]. Red is for notices and
  deadlines only.
- Use the engine's kit first. Draw a new piece in `art.js` only for something the case turns on.
  [List them, for example "the cargo ship, the customs gate".]
- Places: [the two or three places the story visits and what should be seen there].
- No person wears a national costume or carries a stereotype. Mix the unnamed roles evenly.
- Keep to the engine's palette. Every colour is cool-toned and the builder rejects a warm one.

## Build and checks

- Build with `python3 -I build.py stories/[short-name] dist/[short-name].html`. The builder plays
  every route and stops on any fault. Fix the story until it passes. Do not change the engine.
- Write a `checks.js` for anything particular to this story, for example that the meter shows the
  right sum on the right date.
- Save a contact sheet with `node tools/play.js stories/[short-name] --out=.scratch/sheets` and
  look at every scene. The builder cannot see two labels that touch.
- Check every date, sum and clause on screen against the source, line by line, and give me the list.
- Set `link` in `config.js` to [the address where the game will be published, or leave it empty].

## Done means

`dist/[short-name].html` opens offline in a browser and plays to the end in [five to eight]
minutes. Every act opens from the chapter list. The builder passes. Nothing on screen goes beyond
the source. Every proposal is labelled as a proposal. You have given me the list of lines checked
against the source and the list of questions the source left open.
