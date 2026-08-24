# Zolto Bug Report — Comprehensive Deep Audit

**Audit Date:** 2026-07-28
**Project:** Zolto v15.0.0 — Extended Markdown Engine
**Scope:** Full repository audit (CSS, JS, CI/CD, docs, config, PWA, build)
**Methodology:** Manual cross-file analysis, diff comparison, dependency tracing

---

## Executive Summary

A deep audit of the Zolto repository revealed **12 distinct bugs/issues** across CSS architecture, dead code, CI/CD configuration, dependency management, and PWA setup. The most critical issues involve massive CSS bloat from misplaced component styles, entire dead code directories, and incomplete CI validation.

---

## Bug Severity Score

| Severity | Count |
|----------|-------|
| Critical | 3     |
| High     | 4     |
| Medium   | 3     |
| Low      | 2     |
| **Total**| **12**|

---

## Severity Summary

- **Critical:** Directly impacts maintainability, correctness, or build integrity; significant dead or misarchitected code.
- **High:** Causes resource waste, CI gaps, or functional blind spots.
- **Medium:** Contradicts project claims, misses optimization opportunities, or has partial stubs.
- **Low:** Minor inconsistencies, cosmetic drift, or unlikely-to-trigger edge cases.

---

## Category Summary

| Category        | Count |
|-----------------|-------|
| CSS / Styling   | 3     |
| Dead Code       | 3     |
| CI/CD / Build   | 3     |
| Dependencies    | 1     |
| PWA / SW        | 1     |
| Documentation   | 1     |

---

## Per-Bug Details

### BUG-0001 (Critical) — `css/core/variables.css` contains ~385 lines of non-variable CSS

**File:** `css/core/variables.css` (451 lines total)
**Evidence:**
- Lines 1-65: `@import` + `:root` design tokens (legitimate variables)
- Lines 66–451: Full reset rules, `.btn*`, `.lx-modal*`, `#toast`, `#app`, `.workspace`, `.hdr`, `.ed-panel`, `.toolbar`, `#editor`, `.divider`, `.canvas`, `.card.spotlight`, `.prose*`, `.zl-callout*`, `.zl-admonition*`, `.lx-badge*`, `.zl-cb*`, `.zl-code*`, `.zl-copy`, `.zl-pre`, `.zl-ln`, `.zl-table*`, `kbd`, `@media (max-width: 900px)`, `@media (max-width: 320px)`, `@media print`, `body.exporting`

These styles belong in the dedicated files that already exist:
- `css/core/reset.css` (for reset rules)
- `css/components/buttons.css`
- `css/components/modals.css` (also contains `#toast`)
- `css/layout/app.css` (for layout, `.card.spotlight`, responsive, print)
- `css/components/prose.css`

**Impact:**
- ~385 lines of CSS are duplicated across variables.css and the proper component/layout files
- CSS source of truth is fragmented: identical `.card.spotlight`, `@media`, `@media print`, and `body.exporting` rules appear in variables.css AND app.css
- Button/modal/prose styles defined in variables.css AND in `css/components/*.css` (with minor differences)
- Makes CSS maintenance error-prone and unnecessarily bloated

**Confidence:** High (verified by direct file reads and diffs)

**Status:** Open

---

### BUG-0002 (Critical) — Dead `css/base/` directory (9 files, 28 lines, none loaded)

**Files:** `css/base/animations.css`, `css/base/colors.css`, `css/base/normalize.css`, `css/base/reset.css`, `css/base/spacing.css`, `css/base/typography.css`, `css/base/utilities.css`, `css/base/variables.css`, `css/base/z-index.css`

**Evidence:**
- `index.html` loads: `css/core/variables.css`, `css/core/reset.css`, `css/layout/app.css`, `css/components/buttons.css`, `css/components/modals.css`, `css/components/prose.css`
- No `css/base/*` file is referenced anywhere (verified by grep of index.html and all loaded CSS)
- `css/base/reset.css` contains only: `/* Zolto css/base/reset.css — Phase 5: extracted from index.html */` (1 line, no actual CSS)
- `css/base/variables.css` defines a **completely different** token set (`--bg-app`, `--intent-primary`, `--brand-a`, `--brand-b`, `--r`, `--zl-note`, etc.) that no loaded CSS references

**Impact:**
- 9 files (28 lines) of dead code
- Misleading: a developer editing `css/base/variables.css` would expect their changes to take effect
- Phase 5 migration marker comments suggest this was planned but never completed or cleaned up

**Confidence:** High (verified by index.html parsing and grep)

**Status:** Open

---

### BUG-0003 (Critical) — `js/` directory contains ~50+ dead files in parallel source tree

**Files:** `js/core/app.js`, `js/core/config.js`, `js/core/error-boundary.js`, `js/core/i18n.js`, `js/core/lifecycle.js`, `js/core/logger.js`, `js/core/router.js`, `js/core/settings.js`, `js/core/state.js`, `js/core/storage.js`; subdirectories `js/components/`, `js/editor/`, `js/export/`, `js/parser/`, `js/preview/`, `js/renderer/`, `js/utils/` — each with nested subdirectories containing multiple files.

**Evidence:**
- `index.html` only imports `./src/zolto.js` (line 179) — no `js/` file is loaded
- No `import` or `require` from `js/` found in any `src/` file (verified by grep)
- `js/` files do not import from `src/` (verified by grep: 0 imports to `../src`)
- The two trees (`src/` and `js/`) are completely disconnected

**Impact:**
- ~50+ JS files (many hundreds of lines) of dead code that will never execute
- Risk: a developer could maintain `js/` thinking it matters, while the real work happens in `src/`
- Represents significant cognitive overhead for new contributors

**Confidence:** Medium (sampled top-level files; subdirectories may contain symlinks or be referenced indirectly, but no import chain found)

**Status:** Open

---

### BUG-0004 (High) — Duplicate `.card.spotlight`, responsive, and print CSS

**Files:** `css/core/variables.css` (lines 330–451) and `css/layout/app.css` (lines 106–165)

**Evidence (diff of identical selectors):**

| Selector | variables.css | app.css |
|----------|:---:|:---:|
| `.card.spotlight` | L330 | L106 |
| `.card.spotlight:hover` | L341 | L119 |
| `.card.spotlight::before` | L346 | L124 |
| `@media (max-width: 900px)` | L437 | L151 |
| `@media (max-width: 320px)` | L447 | L161 |
| `@media print` | deleted | L158 |
| `body.exporting .card.spotlight` | L451 | L165 |

Minor differences exist (app.css has `min-width: 0; box-sizing: border-box; overflow-wrap: anywhere; word-break: break-word;` on `.card.spotlight` that variables.css lacks), but the vast majority is identical.

**Impact:**
- Duplicated CSS in the critical render path — browser must parse and apply redundant rules
- If one copy is edited and the other is not, rendering inconsistencies arise
- variables.css should NOT contain component/layout styles at all (see BUG-0001)

**Confidence:** High (verified by read and manual diff)

**Status:** Open

---

### BUG-0005 (High) — 3 orphaned test files at repo root not in test harness

**Files:** `test-interpolate.js` (5 lines), `test-interpolate2.js` (5 lines), `test-slot.js` (18 lines)

**Evidence:**
- These files exist at the repository root (not in `tests/`)
- `tests/tests.js` imports from `tests-p2.js` through `tests-p15.js` — no reference to root test files
- `tests/run-all.js` only runs `tests.js`
- `package.json` scripts (`test`, `test:node`, `check`) only reference `tests/` directory
- `test-interpolate.js` imports from `./src/component/props.js` (valid path)
- `test-slot.js` imports from `./src/zolto.js` (valid path)

**Impact:**
- These 28 lines of tests are never executed
- They exercise `interpolateText` and `parseComponent`/`renderComponent` functionality
- If these tests fail silently, no CI signal would detect regression
- Creates clutter at repo root

**Confidence:** High (verified by test harness inspection)

**Status:** Open

---

### BUG-0006 (High) — CI syntax check covers only ~20 of 120+ source files

**File:** `package.json` line 36 — `"check": "node --check src/*.js tests/*.js"`

**Evidence:**
- Glob `src/*.js` does NOT expand recursively — only matches files directly in `src/`
- Only 20 files match `src/*.js` (verified by `ls src/*.js | wc -l`)
- There are 100+ additional JS files in subdirectories: `src/layout/*.js`, `src/plugin/*.js`, `src/animation/*.js`, `src/interactive/*.js`, `src/component/*.js`, `src/tooling/*.js`, `src/ecosystem/*.js`, `src/theme/*.js`, `src/diagram/*.js`, `src/chart/*.js`, `src/vector/*.js`, and more
- Files like `src/layout/canvas.js` (111 lines), `src/plugin/hooks.js`, `src/animation/keyframes.js` etc. are NOT syntax-checked

**Impact:**
- Syntax errors can be introduced in 80%+ of the source files without CI catching them
- `node --check` is fast and could easily be `node --check src/**/*.js tests/**/*.js` (or equivalent)
- Only fix found: the glob expansion is insufficient

**Confidence:** High (verified by glob matching and file count)

**Status:** Open

---

### BUG-0007 (High) — cd.yml references pages.yml with invalid `uses:` syntax

**File:** `.github/workflows/cd.yml` line 16 — `uses: ./.github/workflows/pages.yml`

**Evidence:**
- GitHub Actions does not allow `uses:` to reference another workflow file within the same repository
- `uses:` is for referencing:
  - Public actions: `actions/checkout@v4`
  - Actions in the same repo: `.github/actions/my-action/`
  - Docker images: `docker://...`
- To call another workflow, the target must define `on: workflow_call` and be referenced via `uses: username/repo/.github/workflows/workflow.yml@ref`
- The `pages.yml` workflow does NOT define `on: workflow_call`

**Impact:**
- cd.yml will fail with a validation error when triggered
- Post-CI deployment is completely broken
- The CI pipeline's deployment stage in `ci.yml` (which duplicates the pages.yml steps inline) still works, so deployment is partially functional

**Confidence:** High (GitHub Actions documentation and syntax validation)

**Status:** Open

---

### BUG-0008 (Medium) — "Zero external dependencies" claim contradicted by runtime CDN loads

**Files:** `package.json` line 48 (no `dependencies` key, only `devDependencies`), `index.html` lines 16, 352–360

**Evidence:**
- package.json description mentions no dependencies and lists none — implying zero external runtime deps
- `index.html` line 16: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">` — FontAwesome icon library loaded from CDN
- `index.html` lines 352–360: Dynamic script injection loads `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js` on first PDF export click
- Additional: `css/core/variables.css` line 2: `@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:...')` — Material Symbols icon font

**Impact:**
- Misleading documentation for potential contributors/consumers
- Runtime failure if CDNs are unavailable
- No integrity/Subresource-Integrity (SRI) attributes on any CDN `<link>` or `<script>` tags (see BUG-0010)

**Confidence:** High (verified by reading index.html and package.json)

**Status:** Open

---

### BUG-0009 (Medium) — Service worker does not cache any CSS files

**File:** `sw.js` lines 2–21 (ASSETS_TO_CACHE array)

**Evidence:**
- The service worker caches: index.html, manifest.json, sw.js itself, 8 `src/` JS files, `tests/tests.js`, and `assets/icons/logo/zolto-icon.svg`
- No CSS file is in the cache: not `css/core/variables.css`, `css/core/reset.css`, `css/layout/app.css`, `css/components/buttons.css`, `css/components/modals.css`, or `css/components/prose.css`

**Impact:**
- When the app is opened offline or on a slow network, all stylesheets fail to load
- The app renders without any styling (plain unstyled HTML)
- The fetch handler (lines 60–81) can cache CSS on-the-fly from network, but only after the first successful online load

**Confidence:** High (verified by reading sw.js)

**Status:** Open

---

### BUG-0010 (Medium) — Missing Subresource Integrity on all CDN resources

**File:** `index.html` lines 13, 16; `css/core/variables.css` line 2; `index.html` lines 352–360

**Evidence:**
- None of the externally loaded resources have `integrity` attributes:
  - Google Fonts `<link>` (line 13)
  - FontAwesome CSS `<link>` (line 16)
  - Material Symbols `@import` in variables.css (line 2) — cannot use SRI with `@import`
  - html2pdf.js dynamic `<script>` injection (lines 352–360)

**Impact:**
- If a CDN is compromised, the attacker can serve malicious CSS/JS to all Zolto users
- SRI would prevent this by allowing the browser to verify resource integrity

**Confidence:** High

**Severity:** Medium (low likelihood, but high impact if exploited — combined with BUG-0008)

**Status:** Open

---

### BUG-0011 (Medium) — Empty/no-op config stubs

**Files:** `postcss.config.js`, `babel.config.js`, `jest.config.js`, `tsconfig.json`, `webpack.config.js`

**Evidence:**
- `postcss.config.js`: Only exports `plugins: []` — no PostCSS plugins configured
- `babel.config.js`: Only exports `presets: []` — no Babel presets configured
- `jest.config.js`: Minimal config; the project uses a custom test runner (`tests/run-all.js`), not Jest
- `tsconfig.json`: Empty/compiler options not relevant to a pure JS project
- `webpack.config.js`: Output ES module library config — but `package.json` has no webpack build script and the `index.html` loads raw ES modules directly

**Impact:**
- Misleading — implies tooling that isn't actually used
- `npm run build` is `echo 'No build step required'`, confirming these configs are unnecessary
- A contributor might try `npx jest` or `npx tsc` and get confused by the lack of results

**Confidence:** High

**Status:** Open

---

### BUG-0012 (Low) — `data-theme="leonux"` has no matching stylesheet

**Files:** `index.html` line 2, `css/themes/light.css`, `css/themes/dark.css`

**Evidence:**
- `index.html` sets `<html data-theme="leonux">`
- `css/themes/light.css` targets `[data-theme="light"]` (no matching value)
- `css/themes/dark.css` targets `[data-theme="dark"]` (no matching value)
- Neither theme file is loaded by index.html (verified: only core/*, layout/app.css, and components/* are loaded)
- Both theme files are TODO stubs with no actual theme token overrides

**Impact:**
- The theme system is purely decorative — switching themes has no effect
- The `createThemeEngine`, `applyTheme` exports in `src/theme/` are disconnected from the actual CSS theme files
- Phase-5 migration markers suggest these were planned but never completed

**Confidence:** High

**Status:** Open

---

## File Summary

| File/Directory | Lines | Issues |
|----------------|-------|--------|
| `css/core/variables.css` | 451 | BUG-0001, BUG-0004 |
| `css/core/reset.css` | 49 | (baseline for BUG-0001) |
| `css/layout/app.css` | 165 | BUG-0004 |
| `css/base/` (9 files) | 28 total | BUG-0002 |
| `css/themes/` (2 files) | 8 total | BUG-0012 |
| `js/` (~50+ files) | ~hundreds | BUG-0003 |
| `index.html` | 495 | BUG-0008, BUG-0010 |
| `sw.js` | 82 | BUG-0009 |
| `package.json` | 53 | BUG-0006, BUG-0008 |
| `.github/workflows/cd.yml` | 16 | BUG-0007 |
| `test-interpolate.js` | 5 | BUG-0005 |
| `test-interpolate2.js` | 5 | BUG-0005 |
| `test-slot.js` | 18 | BUG-0005 |
| `postcss.config.js` | 3 | BUG-0011 |
| `babel.config.js` | 3 | BUG-0011 |
| `jest.config.js` | 7 | BUG-0011 |
| `tsconfig.json` | 4 | BUG-0011 |
| `webpack.config.js` | 7 | BUG-0011 |

---

## Cross-File Issues

| Issue | Files Involved |
|-------|----------------|
| CSS duplication | `css/core/variables.css` ↔ `css/layout/app.css` ↔ `css/components/*.css` |
| Dead CSS tree | `css/base/` ↔ (not connected to) `index.html` |
| Disconnected source trees | `js/` ↔ (not connected to) `src/` or `index.html` |
| CI blind spot | `package.json` check script ↔ 100+ unchecked source files |
| CD pipeline | `cd.yml` ↔ `pages.yml` (invalid reference) |

---

## GitHub Actions Audit

| Workflow | Status | Issues |
|----------|--------|--------|
| `ci.yml` | Functional | `test:node` script runs `tests/run-all.js`, deployment steps duplicate pages.yml inline (works) |
| `cd.yml` | **Broken** | BUG-0007: `uses: ./.github/workflows/pages.yml` is invalid syntax; will fail at GitHub Actions validation |
| `lint.yml` | Functional | Runs ESLint on `src/` and `tests/` (note: same glob issue as BUG-0006 — `src/**/*.js` not used) |
| `pages.yml` | Functional | Standalone deploy workflow for GitHub Pages |
| `release.yml` | Functional | Creates GitHub release on tag push, includes tests |
| `test.yml` | Functional | Simple `node tests/run-all.js` — but duplicates CI's test job |

**Additional note:** `lint.yml` also uses non-recursive paths `src/ tests/` — may not lint subdirectory files.

---

## Dependency Audit

| Dependency | Type | Status |
|------------|------|--------|
| ESLint ^10.6.0 | dev | Installed, used |
| Prettier ^3.0.0 | dev | Installed, used |
| serve ^14.0.0 | dev | Installed, used by `npm run dev` |
| FontAwesome CDN | runtime | BUG-0008, BUG-0010 |
| Google Fonts CDN | runtime | BUG-0008, BUG-0010 |
| Material Symbols `@import` | runtime | BUG-0008 |
| html2pdf.js CDN (dynamic) | runtime | BUG-0008, BUG-0010 |

No `npm audit` issues (zero runtime dependencies in package.json; CDN deps are not covered by npm audit).

---

## Documentation Audit

| Document | Status |
|----------|--------|
| `README.md` | Present, describes Phase 15 features |
| `CHANGELOG.md` | Present |
| `CONTRIBUTING.md` | Present |
| `CODE_OF_CONDUCT.md` | Present |
| `SECURITY.md` | Present (3 locations: root, .github/, and referenced) |
| `docs/` | Present — 13 files across api/, development/, guide/ |

**Issues:** None found — documentation is structurally complete. No version/drift issues noted.

---

## Accessibility Audit

**Scope:** `index.html` only (the UI entry point)

| Check | Status |
|-------|--------|
| `lang` attribute | ✓ `lang="en"` on `<html>` |
| Semantic HTML | ✓ Uses `<header>`, `<aside>`, `<main>`, `<footer>` replacement with `div` |
| ARIA labels | ✓ `aria-label="Zolto source editor"` on textarea; `aria-modal="true"` on modal; `aria-hidden="true"` on divider |
| Keyboard navigation | ✓ Editor shortcuts (Ctrl+B, Ctrl+I, etc.), Tab handled |
| Focus styles | ✓ `:focus-visible` defined in CSS |
| Color contrast | ✓ Uses CSS variables — tokens have adequate contrast (dark theme) |
| Viewport meta | ✓ `maximum-scale=1.0, user-scalable=no` — note: prevents zoom, may be an accessibility concern for low-vision users |

**Issues:** None critical. `user-scalable=no` is a minor accessibility concern.

---

## Performance Audit

| Concern | Impact | Severity |
|---------|--------|----------|
| CSS duplication (BUG-0004) | Browser parses redundant rules — minor bloat | Low |
| @import in CSS (variables.css line 2) | Blocks CSS parsing — synchronous fetch | Medium |
| CDN dependencies loaded synchronously (FontAwesome) | Render-blocking until CSS downloaded | Medium |
| html2pdf.js loaded at click time | 2-5s delay on first PDF export (user-visible) | Low (expected) |
| Service worker caches only JS/CSS files | First load has no CSS cache — flash of unstyled content | Medium (BUG-0009) |

---

## Security Audit

| Concern | Impact | Severity |
|---------|--------|----------|
| No Subresource Integrity on CDN (BUG-0010) | CDN compromise → XSS | Medium |
| `cleanCssVal` function in `src/layout/canvas.js:39` | Filters `[;{}<>\\]` — good CSS sanitization | ✓ Fixed |
| No CSP headers (static site — no server) | Cannot enforce CSP — but standard for static sites | Low |
| Input parsing in lexer/parser | Markdown/HTML → HTML — standard XSS surface, but renderer applies escaping | Needs verification |
| No `sandbox` attribute on dynamic content | Content rendered as innerHTML — potential XSS if escaping is missed | Medium |

---

## Build Audit

| Script | Target | Issues |
|--------|--------|--------|
| `dev` | `npx serve . --port 3000` | Works, static file server |
| `test` | `node --input-type=module < tests/run-all.js` | Works |
| `test:node` | `node tests/run-all.js` | Works |
| `lint` | `npx eslint src/ tests/ --ext .js` | Does NOT lint subdirectories (BUG-0006) |
| `format` | `npx prettier --write src/ tests/ *.md` | Works |
| `build` | `echo 'No build step required'` | Works (ES modules served directly) |
| `check` | `node --check src/*.js tests/*.js` | Only checks 20/120+ files (BUG-0006) |

---

*End of report — 12 findings (3 critical, 4 high, 3 medium, 2 low)*
