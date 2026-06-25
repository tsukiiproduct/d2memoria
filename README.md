# D2 Memoria

An interactive star map of the Destiny saga — *The Guardian's Journey*. The page walks
the player through the story one chapter at a time, world by world. Top-center tabs switch
between the star map and two overlays: a **Timeline** (every event in order, with its
location — click a reached chapter to fly there) and **Dossiers** (profiles of the major
figures).

The whole experience is driven by **plain-text content files** that a lore expert can edit
without touching any code. The page reads them at load time.

## Editing the content (no coding required)

All editable content lives in [`content/`](content/). Edit these `.md` files, save, and reload
the page — your changes appear live (when the page is served over http; see below).

| File | What it controls |
|------|------------------|
| [`content/timeline.md`](content/timeline.md) | The ordered **sequence** of story events. Each `## ` block is one event with its location, era, prose, and categorically-labelled **Quest / Gear / Faction / Triumph** associations. The order of blocks *is* the order on the map and in the Timeline tab, and each event's `Location:` drives both where the ship flies and which side panel opens. |
| [`content/dossiers.md`](content/dossiers.md) | The **dossiers** on the biggest figures — role, affiliation, **when they became important**, status, and a prose profile. |
| [`content/LOCATIONS.md`](content/LOCATIONS.md) | Reference list of the valid `Location:` ids used in `timeline.md` (read-only). |

Each file starts with an editing guide in an HTML comment. The format is forgiving:
headings start blocks, `- Category: Name — description` lines add labelled associations,
and everything else is prose.

## Running it

Because the page fetches the content files, it must be served over **http(s)**, not opened
directly from disk (`file://`). Any static server works, e.g.:

```sh
npx http-server -p 8123 -c-1 .
# then open http://localhost:8123/
```

It is also hosted via GitHub Pages. If `fetch` fails (e.g. opened from disk), the page falls
back to a copy of the content baked into the bundle, so it still runs — it just won't reflect
edits to the `.md` files.

## How it's built (for developers)

`index.html` is a self-contained bundle (fonts + a small React runtime + the app, all inlined).
The app's source is kept un-bundled so it stays maintainable:

- [`src-app.js`](src-app.js) — the app logic (the `Component` class: world layout, story flow,
  content loading, render values).
- [`src-markup.html`](src-markup.html) — the app's HTML template (the `<x-dc>` markup).
- [`template.html`](template.html) — the decoded page shell; supplies the unchanging
  outer HTML around the app.
- [`build.js`](build.js) — reassembles `index.html` from the three files above.

After editing `src-app.js` or `src-markup.html`, rebuild:

```sh
node build.js
```

`build.js` has guard checks for two non-obvious pitfalls of embedding the app inside the
bundle's template `<script>` tag: the app source must not contain a literal HTML-comment
marker, and the embedded template must hide its `</script>` and `</x-dc>` closing tags. See
the comments in `build.js` for the why.
