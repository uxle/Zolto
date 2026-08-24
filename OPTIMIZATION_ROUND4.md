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
