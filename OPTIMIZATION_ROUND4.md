# Optimization Pass — Round 4

Follow-on to `AUDIT-ROUND-1-RESOLVED.md`, `BUGS.md`, and `OPTIMIZATION_REPORT.md`
(three prior audit rounds). This round: dead-code verification via import-graph
tracing, a full quiz-engine audit, and a spacing/token consistency pass.
All 884 tests green (`npm test`), no regressions.

## Dead code removed (traced, not guessed)
- `js/` (~50 files, 924K) — only one file was actually reachable
  (`js/export/formats/js-bundle-export.js`, imported by `converter.html`).
  Relocated it to `src/export/js-bundle-export.js`, fixed its own import
  and every reference to it (`converter.html`, `tests/test-js-converter.js`),
  then deleted the rest of the tree.
- `css/base/` and `css/themes/` (13 files incl. a 1215-line orphan theme
  template) — never `<link>`ed by `index.html`, never imported anywhere.
- Orphaned/duplicate test files and empty `export {}` placeholder test
  stubs that only ever tested the now-removed dead `js/` tree.
- 5 no-op build configs (`postcss`, `babel`, `jest`, `tsconfig`, `webpack`)
  — none were invoked by any npm script; the real build uses `esbuild`
  via `scripts/build-dist.mjs`.
- Fixed a `BUGS.md` / `bugs.md` case-collision (renamed the older one to
  `AUDIT-ROUND-1-RESOLVED.md`).
- Rewrote `docs/themes/*.md`, which documented a `data-theme`/file-per-theme
  system that was never wired up, to describe the real, tested Phase 15
  `ThemeEngine` API instead.

## Quiz engine — real, user-facing bugs found and fixed
1. **Rationale leaked the answer.** `@explain` text rendered unconditionally
   in the initial HTML, visible before the learner answered. Now emitted
   with `hidden` and only revealed by the grading runtime after "Check
   Answers" is pressed.
2. **Exported/compiled quizzes were completely non-functional.** The
   bundled runtime JS (`ZOLTO_RUNTIME_JS`, used by the `.zl → .js`
   converter) queried `.zl-quiz-opt`, `[data-quiz-submit]`,
   `.zl-quiz-feedback` — none of which the actual renderer ever emits
   (`.zl-option`, `data-zl-quiz-submit`, `.zl-quiz-score`). Clicking
   "Check Answers" on any exported quiz silently did nothing. Rewrote the
   runtime to match the real DOM, and to actually grade all four question
   types — single/multi-select MCQ (with the same partial-credit scoring
   as `src/interactive/quizzes.js`), true/false, and fill-in-the-blank —
   then reveal hints/explanations and mark each option correct/incorrect.
3. **`@hint`/`@explain` after `@truefalse` or `@blank` parsed as phantom
   quiz questions.** Because those directives only tokenize as
   `KW_HINT`/`KW_EXPLAIN` (no `PROP_*` form) and the single-line question
   parsers only look at `PROP_*` tokens via `collectModsProps()`, a
   trailing hint/explain fell through to the top-level dispatcher and got
   parsed as its own standalone node — silently added to the quiz's
   `questions` array, where `quizScore()` counted it as an extra,
   always-unscorable question and deflated the real score. Now consumed
   and attached to the question they follow.
4. **Every hint/explanation kept its literal surrounding quote marks**
   (`"Think globally"` instead of `Think globally`) in the rendered
   output — `parseHintExplain()` never stripped quotes. Fixed.
5. Wired up a `casesensitive` modifier for fill-in-the-blank questions —
   the AST field and renderer attribute already existed but there was no
   source syntax that could actually reach them.
6. Added the missing `.zl-opt-correct` / `.zl-opt-incorrect` CSS states
   that the (broken) runtime referenced but the stylesheet never defined.
7. Per-option explanations (`opt.explain` on individual MCQ choices) are
   now rendered as a `hidden` span revealed alongside grading, instead of
   being silently dropped.

Five new regression tests cover all of the above in
`tests/integration/deep-audit-regressions.test.js`.

## Spacing / token consistency pass
- Filled a gap in the spacing scale (`--space-6` jumped straight to
  `--space-8`, skipping `--space-7: 56px`) and added micro tokens
  `--space-2xs: 2px` / `--space-xs: 4px` for the sub-8px gaps that were
  previously hardcoded pixel literals.
- Replaced every hardcoded pixel value that exactly matched a token
  (`2px`, `4px`, `8px` used as `gap`/`padding`) with the corresponding
  `var(--space-*)` across `css/layout/app.css`, `css/components/modals.css`,
  and `css/components/prose.css` — zero visual change, all now
  maintainable from one source of truth. Deliberately left `em`-based
  typographic rhythm in `prose.css` and genuine one-off fine-tuning values
  (e.g. the 6px toolbar padding) alone rather than guess at a visual
  change with no way to render and check it here.
- Removed a dead, fully-redundant CSS rule in `app.css`'s narrow-viewport
  media query (`.view-switch .btn span { display: none; }` was completely
  subsumed by the broader `.btn:not(.btn-icon) span` rule immediately
  after it).

## Known limitation carried over from round 3
SRI hashes still aren't added for Google Fonts / Material Symbols — Google
actively discourages SRI on their font CSS since it's served dynamically
per user-agent and would break the hash on every UA variant. This isn't a
regression; noting it again for visibility since it's the one open item
from `OPTIMIZATION_REPORT.md`'s "Known limitation" section.

## Round 4b — deeper pass, same session

### The most significant finding of this whole audit
**No interactive feature worked in the primary product surface at all.**
`index.html`'s live preview did `preview.innerHTML = compile(src)` and never
invoked any interactivity runtime. The only place `ZOLTO_RUNTIME_JS` was ever
used was inside the separate standalone `.zl → .js` export tool
(`converter.html`) — a secondary feature most users never touch. Quizzes,
flashcard decks, polls, `@itabs`, and code-block copy buttons were all inert
in the actual Zolto Studio editor.

**Fixed** by extracting the runtime into a real, canonical, importable,
testable module — `src/interactive/runtime.js` — and:
- having `index.html` import and call it (`initZoltoInteractivity(preview)`)
  after every render, so the live app now has working interactivity for the
  first time;
- having `ZOLTO_RUNTIME_JS` in `src/export/js-bundle-export.js` **derive**
  from that same function via `Function.prototype.toString()` instead of
  being a second, hand-maintained copy of the same logic.

That second part matters beyond tidiness: **the hand-duplicated copy is the
root cause** of the quiz/flashcard/tabs selector-mismatch bugs found and
fixed earlier in this round. Two independently-edited copies of the same
runtime will drift; making one the single source of truth removes the
entire bug class, not just today's instances of it.

### Flashcard deck export was as broken as the quiz export had been
Runtime queried `.zl-flashcard-deck` / `.zl-flashcard` / `.zl-fc-prev` /
`.zl-fc-next` / `.zl-fc-counter` — none of which `renderDeck()` emits (real:
`.zl-deck`, `data-zl-deck-prev`, `data-zl-deck-next`, `data-zl-deck-counter`).
Worse, the renderer only ever places **one** card element in the DOM and
embeds the rest of the deck as JSON in a `<script data-zl-deck-data>` tag —
the old runtime never parsed that JSON, so navigating past card 1 was
structurally impossible no matter what the selectors were. Rewrote it to
read the embedded data and match the CSS's real 3D-flip mechanic (`.flipped`
class, not `.is-flipped`).

### A second, conflicting "tabs" implementation
Two unrelated features share superficially similar naming:
- `@tabs` (top-level document directive, `src/directive-renderer.js`) —
  already fully self-sufficient via its own inline `onclick` handler,
  toggling panels with the `hidden` attribute.
- `@tabs` inside the *interactive* mini-language (`src/interactive/`,
  produces `.zl-itabs`/`.zl-itab-btn`/`.zl-itab-panel`) — a genuinely
  different, separate feature with its own AST/renderer, and (until this
  fix) zero interactivity anywhere.

The old export runtime's "tabs" handler queried `.zl-tabs`/`.zl-tab-btn`,
which matched the *first* feature by class-name coincidence and fought its
already-working inline handler (setting `style.display` after the inline
handler had already set `hidden`, which can override it) — while never
touching the second feature, which actually needed the help. Removed the
conflicting handler and added real wiring for `.zl-itabs`.

### Poll voting was entirely unimplemented
The "Vote" button (`data-zl-poll-submit`) had no handler anywhere, in any
context. Added real single-vote tallying and a results display, reusing
`.zl-poll-bar-row`/`.zl-poll-bar-track`/`.zl-poll-bar-fill` — CSS classes
that already existed in the stylesheet but were never wired to anything
(a smaller instance of the exact same "orphaned feature" pattern).

### `@itabs`/`@accordion` panels silently drop plain prose content
The interactive mini-language's parser has no text/paragraph AST node at
all — `parseNode()`'s `default:` case silently discards any token it
doesn't recognize as a specific directive. A tab or accordion panel
containing ordinary body text (the overwhelmingly common real-world case)
loses that text with **no error, warning, or diagnostic of any kind**.
This appears to be a deliberate scope restriction (the subsystem is
form/widget-oriented by design) rather than a broken implementation, so it
wasn't fixed here — but silent, unwarned data loss is worth flagging
regardless of whether prose support is ever added. Filed as a known gap
rather than fixed, since the real fix (a text-node type across the
tokenizer/parser/AST/renderer) is a feature addition, not a bug fix.

### CLI (`src/cli.js`) — six real bugs
1. Version hardcoded as `"1.0.0"` in two places, drifted from
   `package.json`'s real `"1.0.2"`. Now read from `package.json` at runtime
   (single source of truth), with a safe fallback.
2. `zolto package` ran `tar -czf pkg.zlpackage .` with **no exclusions** —
   would bundle `node_modules` and `.git` into every release artifact in a
   real project. Now excludes the usual junk.
3. `zolto lint`/`zolto format` used a `command || echo "not installed"`
   pattern that reported **every** nonzero exit — including real lint
   errors or unformatted files found by a properly-installed tool — as
   "not installed," hiding the exact failures the command exists to
   surface. Now distinguishes "the tool truly isn't resolvable" from
   "the tool ran and found real problems."
4. Unused `spawn` import (dead code).
5. `zolto doctor` printed environment info but never actually checked it
   against anything — always printed "Everything looks good!" regardless
   of whether `package.json`'s own `engines.node: >=20.0.0` was satisfied.
   Now actually checks it.
6. `build`/`render`/`preview`/`validate` crashed with a raw, unfriendly
   Node stack trace on a missing input file (unguarded `readFileSync`).
   Now a clean error message. `preview` also used to say "Opening
   preview..." without opening anything or saying where — now it prints
   the actual URL being served.

All verified by actually running the CLI end-to-end (`create`, `validate`,
`build`, `package` with dummy `node_modules`/`.git` present, `doctor`,
missing-file `validate`), not just read through.

Ten new regression tests cover this section's fixes, for 889/889 total,
stable across repeated runs.
