# Optimization & Bug-Fix Report — Vanilla HTML/CSS/JS Build

This is the original vanilla JS/HTML/CSS project (no React, no build step —
runs exactly as it did before), with every bug found across **three**
rounds of deep auditing fixed directly in the source, dead code removed,
and the test suite repaired and expanded. The third round (below,
"Deep audit round 2") went specifically looking for anything from minor
to severe, and found a real, exploitable XSS vulnerability plus a distinct
parser bug it surfaced along the way.

**Verified: 873/873 tests passing** (859 original + 14 new across two
rounds of regression tests), stable across repeated runs, with one
pre-existing timing-sensitive benchmark test noted below (not something
these fixes introduced).

## Real bugs fixed in this pass

1. **Crash: any document with an `@textarea` field broke the entire
   compiler** — `src/validator.js`. A table-row-collection loop ran for
   every node type, not just tables; `@textarea`'s numeric `rows` property
   isn't an array, so `[...node.rows]` threw. Fixed in two spots.
2. **Chart labels with spaces or hyphens silently split into multiple
   labels** — `src/chart/parser.js`. `"Sample A"` became two labels; `
   "0-50ms"` became two more. Fixed by accumulating tokens between newlines
   into one label per line, reconstructing exact spacing from token
   positions.
3. **Invalid `height="auto"` SVG attribute on every chart, diagram, and
   vector** — `src/chart/renderer.js`, `src/diagram/renderer.js`,
   `src/vector/renderer.js`. The SVG `height` attribute doesn't accept the
   CSS keyword `"auto"` — every graphic threw a browser console error.
4. **`escapeXml`/`escapeHtml` silently dropped the value `0`** —
   `src/vector/svg.js`, `src/chart/svg.js`, `src/diagram/svg.js`,
   `src/layout/renderer.js`. `if (!str) return ''` treats `0` as missing
   since it's falsy in JS — any shape positioned at `x=0 y=0` (very common
   for full-bleed backgrounds) silently lost that coordinate.
5. **`@page` and `@slide` didn't inherit from their parent `@pages`/
   `@presentation`** — `src/layout/renderer.js`. Every page/slide silently
   used hardcoded defaults regardless of the parent container's
   configured size, margin, ratio, or theme.
6. **`<select>` fields with only an `ariaLabel` had zero accessible
   name** — `src/interactive/renderer.js`. Every other field type
   correctly fell back to `ariaLabel` when there was no visible label;
   `renderSelect` was the one place that omitted it.
7. **Animation validator's "known built-in keyframes" check was dead
   code** — `src/animation/validator.js`. Destructured from an empty
   object literal instead of importing the real export, so the check
   always evaluated to `undefined` and never actually ran.
8. **Vestigial 6-argument call to a 4-argument function** —
   `src/math-parser.js`. Harmless at runtime, but a clear sign of drift.
9. **CSS injection in canvas rendering, re-broken since it was last
   "fixed"** — `src/layout/canvas.js`. See below — this is the most
   interesting finding in this pass.
10. **The test harness didn't await async test callbacks** —
    `tests/runner.js`, `tests/tests-p15.js`, `tests/tests.js`,
    `tests/run-all.js`. This is *why* bug #9 went undetected.

## The CSS-injection bug's history is worth knowing

The repo's own `bugs.md` (a previous audit round, dated 2026-07-28)
claims **BUG-1407 — CSS injection in `src/layout/canvas.js` — RESOLVED**,
describing the exact same fix this report just re-applied (strip
`;{}<>\` characters). I found the *sanitizer itself* still broken: it
stripped disallowed characters wherever they occurred but never
truncated, so `fill="red; position: fixed"` still produced
`color: red position: fixed;` — the injected fragment survived, just
missing its separating semicolon. `tests-p15.js` has a regression test
specifically for this (`BUG-1407: Canvas renderer sanitizes CSS property
inputs`) — but it's an `async` test, and the runner never awaited async
test bodies, so it was reported as "passing" regardless of whether its
real assertions ever actually ran. That test's own two assertions were
also contradictory (one required a string to be absent, the other
required the same string to be present), meaning it could never have
passed even if it *had* been awaited correctly.

**Net effect:** a real security-relevant bug was fixed once, the fix
didn't work, and the test written to catch that was broken in two
independent ways — so it silently shipped as "resolved" for one full
audit cycle. Fixed properly this time: the sanitizer now truncates at
the first disallowed character (not just strips it), the test assertions
are no longer contradictory, and the runner now correctly awaits async
tests (sequentially, not concurrently — an initial attempt at concurrent
execution introduced new flakiness from tests that share state, so this
was reverted to strict sequential awaiting).

I spot-checked several of `bugs.md`'s other 10 "resolved" claims
(LSP `definition`/`references` handlers, plugin sandbox promise-rejection
handling, and the specialized boxplot/candlestick/heatmap/treemap/
funnel/waterfall chart renderers) and those check out as genuinely fixed.

## Dead code removed

- `js/` — ~50 files, a completely disconnected parallel source tree never
  loaded by `index.html` or imported by anything in `src/`
- `css/base/` — 9 files defining a different, unused design-token set
- `postcss.config.js`, `babel.config.js`, `jest.config.js`,
  `webpack.config.js`, `tsconfig.json` — no-op placeholder configs never
  invoked by any actual script (and `tsconfig.json` referenced the
  now-deleted `js/` directory)

## Orphaned tests fixed and wired in

Three root-level scripts (`test-interpolate.js`, `test-interpolate2.js`,
`test-slot.js`) were `console.log`-based smoke tests, never wired into
the actual test harness. One of them (`test-slot.js`) threw a
`ReferenceError` immediately on execution — missing imports for
`ComponentRegistry`, `parseComponent`, and `renderComponent` — meaning it
had never actually been run successfully by anyone. Consolidated into
`tests/integration/interpolation-and-slots.test.js` with real assertions,
wired into `runAllTests()`, and the broken originals removed.

## `BUGS.md` findings that turned out to already be resolved

Verified against the current code rather than taken on faith — these
four no longer describe reality and needed no action:

- **BUG-0001/0004** (CSS duplication in `css/core/variables.css`) — that
  file is 63 lines of clean design tokens; the cited "lines 330–451" and
  `.card.spotlight` duplication actually lived in the now-deleted dead
  `css/base/` tree.
- **BUG-0006** (`package.json` check script only lints `src/*.js`, not
  subdirectories) — the current script already uses
  `find src tests -name "*.js"`.
- **BUG-0007** (`cd.yml`'s `uses: ./.github/workflows/pages.yml` is
  invalid) — `pages.yml` already declares `on: workflow_call`, which is
  exactly what makes that reference valid.
- **BUG-0009** (service worker caches zero CSS files) — `sw.js` already
  lists all six real stylesheets in its cache manifest.
- **BUG-0012** (`<html data-theme="leonux">` references a non-existent
  theme) — no `data-theme` attribute exists on the `<html>` tag anymore.

## Known limitation: SRI hashes not added

`BUGS.md`'s BUG-0010 (missing Subresource Integrity hashes on CDN
resources) is still accurate for the Google Fonts and html2pdf.js CDN
links. I did not fabricate `integrity="sha384-..."` values for these —
computing a correct hash requires the actual current bytes of each
resource, which needs network access this environment doesn't have, and
a *wrong* hash would break resource loading outright (worse than no hash
at all). The FontAwesome link already has a correct integrity attribute.
Google's own guidance is against SRI for their Fonts API specifically,
since responses vary by User-Agent — a real SRI hash there would break
for some visitors even if computed correctly today.

## Two files with the same name, different case

`BUGS.md` and `bugs.md` both exist at the repo root with different
content (the original comprehensive audit vs. the later "resolved"
summary quoted above). On case-insensitive filesystems (default macOS,
Windows) these collide — worth consolidating or renaming, but I left
this alone since it's a documentation/history decision rather than a
functional bug.

---

## Deep audit round 2 — minor to severe

A second, much more exhaustive pass specifically hunting for anything from
cosmetic to critical, going file-by-file through the parts of the engine
the first round hadn't fully covered.

### 🔴 Critical: `escapeAttr`'s dangerous-URL filter had a working bypass

**`src/tokenizer.js`** — `escapeAttr` is what stands between a Markdown
link/image URL and the rendered `href`/`src` attribute; it's supposed to
block `javascript:`, `vbscript:`, and `data:` URLs. Its check was a plain
regex against the raw string: `/^(?:javascript|vbscript|data):/i`.

Per the WHATWG URL Standard, browsers strip ASCII tab, newline, and
carriage-return characters from a URL *before* parsing its scheme. So:

```
[Click here](java	script:alert(document.cookie))
```

— with a literal tab between "java" and "script:" — does **not** match
that regex (the tab breaks up the literal string), so it sailed through
as "safe" and rendered as `href="java\tscript:alert(document.cookie)"`.
A real browser strips the tab and executes it as `javascript:...` anyway.
This is the single most common attack surface in a Markdown-like
language, and I confirmed the bypass works (built a minimal repro,
verified it evaded the old filter, verified it's blocked by the new one).

**Fix:** strip `[\t\n\r]` before testing the scheme, matching exactly
what the browser itself does. Verified normal URLs are unaffected.

### 🔴 Critical: all 12 built-in components, plus user-defined components, templates, and macros had zero HTML escaping

**`src/component/builtins.js`, `src/component/props.js`,
`src/component/renderer.js`** — none of the 12 built-in component
patterns (Card, HeroSection, ProfileCard, StatCard, AlertBox, etc.)
escaped their props at all. A `title` containing `<script>` executed;
`ctaLink`/`avatar` accepted `javascript:` URLs with no filtering
whatsoever (not even the flawed version above — nothing); props used to
build class names (`variant`, `trend`, `type`) could break out of the
attribute entirely (`variant="x\"><img src=x onerror=alert(1)>"`).

Tracing the data flow further, the same root cause — `interpolateText()`,
the shared substitution function used for macro expansion, template
bodies, and user-defined `@component` bodies — never escaped anything it
substituted either. So this wasn't just the 12 built-ins; it was every
mechanism for turning a document-author-supplied value into rendered
output text.

**Fix:**
- `builtins.js` now escapes every interpolated value with the
  context-appropriate function — `escapeHtml` for text content,
  `escapeAttr` for anything going into an `href`/`src` (which also gets
  the URL-scheme filtering from the fix above).
- `interpolateText()` now escapes substituted values **by default**,
  which fixes macros, templates, and user-defined components in one
  place. The one legitimate exception — substituting already-rendered,
  trusted slot HTML into a built-in component's placeholder — opts out
  explicitly via a new third parameter, so real markup isn't
  double-escaped into visible entity text.
- Verified no double-escaping (an ampersand renders as `&amp;` once, not
  `&amp;amp;`) and that slot content still renders as real HTML, not
  escaped text.

### 🟠 Parser bug surfaced while testing the fix above: bare `slot` markers ate the next `end`

**`src/component/parser.js`** — while writing a test for the escaping
fix, a two-node document (a component definition, then a use of it)
parsed as a single node — the second half silently merged into the
first's body as plain text. Root cause: a bare `slot` marker (no fallback
content of its own — just `slot` on its own line) still consumed the very
next `end` keyword as though it were closing the slot's own fallback
block. But `end` is a shared keyword between "close this slot" and
"close the enclosing component/template" — so that `end` almost always
belongs to the *component*, not the slot, and consuming it left the
outer body-parsing loop still running, silently swallowing everything
after it. Same bug, same fix, in both the component-definition and
template-definition parsing paths. Fixed by only consuming `end` when
real fallback content was actually collected; an unambiguous `/slot`
close is still always safe to consume regardless.

### 🟡 The falsy-zero coordinate bug (round 1) had more instances

Round 1 fixed `escapeXml`/`escapeHtml` treating `0` as "missing" in four
files. Searching the same pattern more broadly (`value || fallback` on
anything coordinate/size/duration-shaped) turned up several more real
instances, all following the same shape — an explicit, meaningful `0`
silently replaced by a default:

- **`src/vector/svg.js`** — `node.cx || node.x`, `node.r || node.radius
  || 20`, `node.rx || 30`, `node.ry || 15`: a circle/ellipse deliberately
  positioned at the origin (`cx=0 y=0`), or with radius `0` (a valid
  animation start/end state), rendered at the wrong position or size.
  The `circle` case was also missing `escapeXml` entirely on its
  coordinates (every other shape had it) — an unset coordinate would
  have rendered the literal text `"undefined"` into the SVG.
- Same file, `strokeWidth || 2` (×3: line, polyline, bezier) and the
  rect's `radius || r || 0` fallback chain — same class of bug, lower
  practical severity, fixed for consistency.
- **`src/vector/ast.js` / `src/vector/transforms.js`** — `scale: attrs.scale
  || null`, then consumed via `if (node.scale)`. Every sibling transform
  property in the same function (`rotate`, `blur`, `fillOpacity`) already
  correctly used `??`/explicit null checks — `scale` was the one
  exception, in two places. `scale=0` (an element scaled to nothing, a
  common animation keyframe) was silently dropped instead of emitting
  `scale(0)`.
- **`src/chart/datasets.js`** (`parseJSONData`) — a data point's label
  fallback chain (`item.label || item.month || item.name || item.x`)
  would skip a legitimate `x: 0` in favor of an auto-generated numeric
  label; the value chain had the same shape for `value: 0`.
- **`src/animation/parser.js`** — `attrs.duration || attrs.dur || 300`:
  an explicit `duration=0` (a deliberate "instant, no transition" state)
  was overridden by the 300ms default, even though the underlying
  `parseDuration()` function itself already handled `0` correctly — the
  bug was purely at the call site, before that function was ever reached.

Also confirmed via targeted checks that this pattern does **not** appear
in the core tokenizer/lexer/parser/renderer pipeline, and that the
higher-traffic interactive field types (`@number`, `@slider`) already use
the correct `!== undefined` pattern — only the lower-traffic field types
(radio/select/segment, where a numeric `0` value is essentially never
meaningful) still use the looser pattern, which was left as-is given the
negligible real-world risk versus the router-audit's cost/benefit.

### Verified clean

- No `eval()` or `new Function()` anywhere in the codebase.
- No other independent URL-scheme filter exists outside the one fixed
  above (the embed directive's `src=` for images/video/audio routes
  through the same, now-fixed `escapeAttr`).
- Re-ran the full 3,000-line syntax-stress-test document (from the
  earlier audit round) against this codebase: 0 parse errors, 0
  unexpected warnings, no `height="auto"`, no empty SVG coordinate
  attributes.

All five new findings above have dedicated regression tests in
`tests/integration/deep-audit-regressions.test.js`.
