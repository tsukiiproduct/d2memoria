const fs = require("fs");

// Boundaries come from the current decoded template (markers are unchanged by our edits).
const orig = fs.readFileSync("template.html", "utf8");
const a = orig.indexOf("<x-dc>") + "<x-dc>".length;
const b = orig.indexOf("</x-dc>", a);
const sOpen = orig.slice(b).match(/<script type="text\/x-dc"[^>]*>/)[0];
const sOpenIdx = orig.indexOf(sOpen, b) + sOpen.length;
const sCloseIdx = orig.indexOf("</script>", sOpenIdx);

const newMarkup = fs.readFileSync("src-markup.html", "utf8"); // x-dc inner only
const newScript = fs.readFileSync("src-app.js", "utf8");       // x-dc script only

// GUARD: the x-dc <script> is embedded verbatim inside the page's bundler-template
// <script> tag. A literal HTML-comment marker in it flips the browser's script-data
// tokenizer into escaped mode and corrupts how the runtime parses the template
// (styles vanish, sc-for bindings break). Build such markers from concatenation in
// src-app.js instead of writing them literally. (Markdown comments in content/*.md
// are fine — those are fetched at runtime, not embedded here.)
const CMT_OPEN = "<!" + "--", CMT_CLOSE = "--" + ">";
if (newScript.includes(CMT_OPEN) || newScript.includes(CMT_CLOSE))
  throw new Error("src-app.js contains a literal HTML-comment marker — build it from concatenation instead (see CMT_OPEN/CMT_CLOSE).");

const newTpl = orig.slice(0, a) + newMarkup + orig.slice(b, sOpenIdx) + newScript + orig.slice(sCloseIdx);
fs.writeFileSync("template.html", newTpl);

// Re-embed as the JSON-stringified bundler template on line 178 of index.html.
const lines = fs.readFileSync("index.html", "utf8").split(/\r?\n/);
if (!/^\s*<script type="__bundler\/template">/.test(lines[176])) throw new Error("line 177 is not the template open tag");
if (lines[177][0] !== '"') throw new Error("line 178 is not a JSON string");
// Two closing tags must be hidden from raw-text scanners while still decoding back
// to themselves via JSON.parse (\/ -> /). Both match what the original bundler did:
//  - </script>: otherwise prematurely closes the host <script type="__bundler/template">.
//  - </x-dc>:   the runtime re-fetches this page's raw HTML and regex-extracts
//               <x-dc>...</x-dc>; a literal close lets it re-read the JSON-escaped
//               template (list=\"{{ ... ) and overwrite the good DOM-parsed one.
lines[177] = JSON.stringify(newTpl).replace(/<\/(script|x-dc)>/g, "<\\/$1>");

// GUARD: confirm neither closing tag survives as a literal in the embedded line.
if (lines[177].includes("</script>")) throw new Error("embedded template still contains a literal </script>");
if (lines[177].includes("</x-dc>")) throw new Error("embedded template still contains a literal </x-dc>");

fs.writeFileSync("index.html", lines.join("\n"));
console.log("Rebuilt index.html. New template chars:", newTpl.length);
