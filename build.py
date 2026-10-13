#!/usr/bin/env python3
"""Build one story into one self-contained HTML file.

    python3 -I build.py stories/starter dist/starter.html
    python3 -I build.py stories/starter dist/starter.html --force     (replace the file if it is already there)

The builder needs Python 3 and Node.js, and nothing from the network.

Before it writes anything it plays the story without a browser (tools/play.js): once on the moves on the
record, four times on random moves, twice on auto play, and once from every chapter. It then checks the menus
and the pointer (tools/menus.js) and runs the story's own checks if the story folder has a checks.js.
Any problem stops the build and nothing is written.
"""
import html, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "engine")
TOOLS = os.path.join(HERE, "tools")
ENGINE_MENUS = {"title", "pause", "chapters", "parts"}     # the engine's own menus are left out of the story as text


def read(*parts):
    with open(os.path.join(*parts), encoding="utf-8") as f:
        return f.read()


def node(args, what):
    r = subprocess.run(["node"] + args, capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    if r.returncode != 0:
        sys.exit("build stopped: %s\n%s" % (what, r.stderr.strip()))


def rich(s):
    """Plain words for the page. The only markup kept is <kbd>, for the name of a key."""
    return re.sub(r"&lt;(/?)kbd&gt;", r"<\1kbd>", html.escape(s, quote=False))


def plain(s, keep):
    """A label written in capitals on the screen, as a reader would write it."""
    out = " ".join(keep.get(w, w.lower()) for w in s.split())
    return out[:1].upper() + out[1:]


def speaker(s, keep):
    return " ".join(keep.get(w, w.title()) for w in s.split())


def transcript(log, meta):
    """The route on the record as headings and paragraphs, for the 'story as text' panel under the game."""
    acts, opts = meta["acts"], meta["config"].get("transcript") or {}
    keep, skip = opts.get("keep") or {}, set(opts.get("skipMenus") or [])
    out, act, lastq = [], None, None
    for e in log:
        if e["act"] != act and 0 <= e["act"] < len(acts):
            act = e["act"]
            out.append("<h2>%s</h2>" % html.escape(acts[act]["heading"] or plain(acts[act]["menu"], keep)))
        if e["t"] == "say":
            kind = e.get("kind")
            if kind == "roll":
                if e["name"] and e["name"] != lastq:
                    lastq = e["name"]
                    out.append('<p class="q">[%s]</p>' % html.escape(plain(e["name"], keep)))
                out.append("<p>%s</p>" % html.escape(e["text"]))
            elif kind == "card":
                out.append('<p class="card">%s</p>' % html.escape(e["text"]))
            elif e["name"]:
                out.append('<p><span class="who">%s.</span> %s</p>' % (html.escape(speaker(e["name"], keep)), html.escape(e["text"])))
            else:
                out.append("<p>%s</p>" % html.escape(e["text"]))
        elif e["t"] == "menu" and e.get("id") not in ENGINE_MENUS and e["title"] not in skip:
            names = [plain(o, keep) for o in e["opts"]]
            head = plain(e["title"], keep)
            rec = ""
            if e.get("canon") is not None:
                rec = " On the record: %s." % names[e["canon"]]
            out.append('<p class="choice">A choice%s: %s.%s</p>' % (html.escape(". " + head if head else ""), html.escape(", ".join(names)), html.escape(rec)))
    return "\n".join(out)


def keys_block(keys):
    rows = "".join("    <li>%s</li>\n" % rich(k) for k in keys)
    return '  <ul class="keys" aria-label="Keys">\n%s  </ul>\n' % rows


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if len(args) != 2 or flags - {"--force"}:
        sys.exit(__doc__)
    story, dest = os.path.abspath(args[0]), os.path.abspath(args[1])
    if not os.path.isfile(os.path.join(story, "story.js")):
        sys.exit("no story.js in %s: give the folder of a story, for example stories/starter" % story)
    if os.path.exists(dest) and "--force" not in flags:
        sys.exit("refusing to overwrite %s: give a new file name, or add --force" % dest)
    if not shutil.which("node"):
        sys.exit("Node.js is needed to play the story before it is built: install it from nodejs.org, then run this again")

    with tempfile.TemporaryDirectory() as tmp:
        node([os.path.join(TOOLS, "play.js"), story, "--all", "--out=" + tmp], "the playthrough reported problems")
        node([os.path.join(TOOLS, "menus.js"), story], "the menu and pointer checks failed")
        if os.path.isfile(os.path.join(story, "checks.js")):
            node([os.path.join(story, "checks.js")], "the story's own checks failed")
        with open(os.path.join(tmp, "transcript.json"), encoding="utf-8") as f:
            log = json.load(f)
        with open(os.path.join(tmp, "meta.json"), encoding="utf-8") as f:
            meta = json.load(f)

    cfg = meta["config"]
    title = cfg.get("title") or ""
    if not title:
        sys.exit("build stopped: config.js gives no title")
    lede = cfg.get("lede") or "A case as a short pixel game. Walk, talk and choose the next step. Press <kbd>N</kbd> at any point to play what the record says."
    code = "\n".join("/* ---- %s ---- */\n%s" % (name, read(story, name)) for name in meta["files"])
    scripts = {
        "/*@@FONT@@*/": json.dumps(json.loads(read(ENGINE, "font.json")), ensure_ascii=False, separators=(",", ":")),
        "/*@@ENGINE@@*/": read(ENGINE, "engine.js"), "/*@@KIT@@*/": read(ENGINE, "kit.js"), "/*@@QR@@*/": read(ENGINE, "qr.js"),
        "/*@@GAME@@*/": read(ENGINE, "game.js"), "/*@@STORY@@*/": code,
    }
    words = {
        "@@LANG@@": (html.escape(cfg.get("lang") or "en", quote=True), 1),
        "@@TITLE@@": (html.escape(title, quote=False), 2),
        "<!--@@KICKER@@-->": ('    <p class="kicker">%s</p>\n' % rich(cfg["kicker"]) if cfg.get("kicker") else "", 1),
        "<!--@@LEDE@@-->": ('  <p class="lede">%s</p>\n' % rich(lede), 1),
        "<!--@@FOOT@@-->": ('  <p class="foot">%s</p>\n' % rich(cfg["foot"]) if cfg.get("foot") else "", 1),
        "<!--@@TRANSCRIPT@@-->": (transcript(log, meta), 1),
    }
    page = read(ENGINE, "shell.html")
    a, b = page.find("<!--@@KEYS-BEGIN@@-->\n"), page.find("<!--@@KEYS-END@@-->\n")
    if a < 0 or b < a:
        sys.exit("engine/shell.html has lost its key list markers")
    default_keys = page[a + len("<!--@@KEYS-BEGIN@@-->\n"):b]
    page = page[:a] + (keys_block(cfg["keys"]) if cfg.get("keys") else default_keys) + page[b + len("<!--@@KEYS-END@@-->\n"):]
    for k, (v, count) in words.items():
        if page.count(k) != count:
            sys.exit("engine/shell.html should hold %s %d time(s)" % (k, count))
        page = page.replace(k, v)
    for k, v in scripts.items():                             # code goes in last, so nothing in it is read as a placeholder
        if page.count(k) != 1:
            sys.exit("engine/shell.html should hold %s once" % k)
        if "</script" in v.lower():
            sys.exit("a source file contains a closing script tag (%s): write it as '<' + '/script>'" % k)
        page = page.replace(k, v)

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(page)
    print("wrote %s (%d KB)" % (dest, len(page.encode("utf-8")) // 1024))


if __name__ == "__main__":
    main()
