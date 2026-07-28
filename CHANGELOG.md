# Changelog

All notable changes to Zolto are documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) |
Versioning: [Semantic Versioning](https://semver.org/)

## [1.0.0] — v1.0 Stable Release

Date: 2026-07-28

### Added
- **Official CLI**: A unified command-line tool `zolto` for creating, building, serving, and validating Zolto projects.
- **Language Specification**: Unified and finalized the Zolto Language Specification (`SPECIFICATION.md`).
- **Feature & API Freeze**: The Zolto Core APIs and Language Features are officially frozen for the v1.x lifecycle.
- **Starter Templates**: Added `blank-document.zl`, `portfolio.zl`, `report.zl`, and `knowledge-base.zl` templates.
- **Governance**: Added `GOVERNANCE.md`, Issue templates, and PR templates.
- **Localization**: Added an initial `src/i18n.js` framework for localized string resolution.


## [15.0.0] — Phase 15 — Universal Theme & Design System

Date: 2026-07-28

### Added

#### Universal Theme Subsystem (`src/theme/`)
- **Core Built-in Themes**: Light Theme, Dark Theme, and Eye Protection Mode (`#fbf7ee`, `#f3ebd8`, `#2d271e`, `#5c4f3d`) with warm amber hues, reduced blue light feel, and soft contrast for long reading sessions.
- **Design Tokens**: Standard CSS custom property tokens (`--zl-bg-canvas`, `--zl-bg-surface`, `--zl-text-primary`, `--zl-accent-primary`, `--zl-font-sans`, `--zl-space-md`, `--zl-radius-md`, `--zl-motion-duration`).
- **Theme Engine**: Token lookup, inheritance, component-level overrides, and CSS custom property generation (`ThemeEngine`).
- **Runtime Theme Switcher**: Instant runtime theme toggling without full document reloads (`ThemeSwitcher`).
- **Theme Package Builder**: Bundles themes, palettes, and typography presets into portable `.zltheme` package AST nodes (`ThemePackageBuilder`).
- **WCAG Contrast & Accessibility**: WCAG 2.1 AAA contrast ratio validator, reduced motion compatibility, large text mode, and dyslexia-friendly font presets (`ThemeAccessibility`).

### Tests
- Total **853/853** tests passing across all 15 completed phases with 0 regressions.

---

## [14.0.0] — Phase 14 — Collaboration, Versioning & Production Ecosystem

Date: 2026-07-28

### Added

#### Production Ecosystem Subsystem (`src/ecosystem/`)
- **Real-time Collaboration**: Live user presence, cursor tracking (`Cursor`), selection highlighting (`Selection`), and shared document state (`CollaborationEngine`).
- **Threaded Review Comments**: Location-aware comment threads (`CommentThread`), replies (`CommentReply`), mentions, and resolution states (`CommentEngine`).
- **Version History & Diffs**: Document checkpoints (`DocumentVersion`), timeline history navigation, structural diffs (`VersionDiff`), and version rollback (`VersionHistory`).
- **Branching & Merging**: Document branching, merge requests (`MergeRequest`), conflict detection, and non-destructive patch merging (`BranchEngine`).
- **Workspace & Packaging**: Multi-file project workspace indexing (`WorkspaceManager`) and portable project package archives (`PackageBuilder`).
- **Publishing Pipeline**: Production HTML/PDF/SVG publishing and tagged deployment artifacts (`PublishingPipeline`).
- **Multi-Format Export**: Multi-format exporter targeting HTML, SVG, PDF, JSON, Markdown, and Plain Text (`ExportPipeline`).
- **Role-Based Access Control**: Granular RBAC permissions (Owner, Editor, Reviewer, Commenter, Viewer, Admin, Guest) (`AccessControl`).
- **Sync Engine**: Local and remote delta sync, offline queueing, and reconciliation (`SyncEngine`).
- **Backup & Recovery**: Automated snapshot backups (`BackupSnapshot`) and disaster recovery (`BackupManager`).
- **Compliance Audit Trail**: Immutable audit logs (`AuditEntry`) recording who changed what, approvals, reverts, and publishing releases (`AuditTrail`).

### Tests
- Total **844/844** tests passing across all 14 completed phases with 0 regressions.

---

## [13.0.0] — Phase 13 — Language Server, IDE Integration & Compiler Optimizations

Date: 2026-07-28

### Added

#### Tooling Subsystem (`src/tooling/`)
- **Language Server Protocol (LSP)**: Full `LspServer` request dispatcher handling `initialize`, `textDocument/didOpen`, `textDocument/didChange`, `textDocument/completion`, `textDocument/hover`, `textDocument/formatting`, `textDocument/codeAction`, and `textDocument/documentSymbol`.
- **Auto-Completion Engine**: Context-aware completion suggestions (`CompletionEngine`) for headings, directives (`@card`, `@todo`, `@slides`), attributes, component props, math commands (`\frac`, `\sqrt`), chart fields, diagram nodes, and theme tokens.
- **Hover Information Engine**: Inline hover documentation (`HoverEngine`) providing concise usage explanations, syntax signatures, and code examples.
- **Diagnostics Engine**: Location-aware syntax and block analysis (`DiagnosticsEngine`) identifying unclosed block directives, mismatched tags, and offering quick-fix recommendations.
- **Document Formatter**: Idempotent document formatter (`FormatterEngine`) enforcing 2-space block directive indentation and attribute alignment.
- **Document Linter**: Rule-based linter (`LinterEngine`) checking for empty directives, duplicate headings, and style anti-patterns.
- **Refactoring Engine**: Code action refactoring providers (`RefactorEngine`) for directive case normalization and component extraction.
- **Document Indexer**: Fast symbol indexer (`DocumentIndexer`) tracking headings, directives, components, math labels, and cross-references.
- **Search Engine**: Full-text and symbol search engine (`SearchEngine`) across multi-document projects.
- **Incremental Compilation**: Dirty-region tracking pipeline (`IncrementalPipeline`) for incremental parsing and fragment rendering reuse.
- **Layered Cache**: Invalidation-aware cache manager (`CacheManager`) for tokens, ASTs, rendered HTML/SVG fragments, and symbols.
- **File Watching & Editor Support**: Import dependency watcher (`FileWatcher`) and editor integration (`EditorIntegration`) for code folding ranges and outline trees.

### Tests
- Total **829/829** tests passing across all 13 completed phases with 0 regressions.

---

## [12.0.0] — Phase 12 — Plugin API & Extension System

Date: 2026-07-28

### Added

#### Plugin Subsystem (`src/plugin/`)
- **Plugin Manifest Engine**: Declarative `@plugin` block and JS object manifest parser (`parsePluginManifestBlock`, `parsePluginManifestObject`).
- **Plugin Lifecycle State Machine**: Controlled lifecycle transitions (`load`, `initialize`, `register`, `activate`, `suspend`, `reload`, `unload`, `destroy`).
- **Plugin Registry**: `PluginRegistry` managing active/disabled plugins, topological sorting, dependency checks, and conflict reporting.
- **Priority Hook Engine**: Hook execution engine (`HookEngine`) supporting priority ordering (100 vs 50 vs 0) and error containment across 15 extension points (`beforeTokenize`, `afterParse`, `beforeRender`, etc.).
- **Custom Directive Registry**: Custom directive registration (`DirectiveRegistry`) enabling dynamic plugin syntax (e.g. `@todo status="open"`).
- **Custom Renderer Registry**: Target-specific custom renderer dispatch (`RendererRegistry`) supporting HTML, SVG, PDF, JSON, and Plain Text export targets.
- **Theme Extension Engine**: Token inheritance and CSS custom property generator (`ThemeRegistry`) emitting `:root[data-zl-theme="name"]` overrides.
- **Data Provider Registry**: External and computed data provider feeds (`DataProviderRegistry`) with local caching.
- **Permissions & Security**: Opt-in permission management (`PermissionManager`) for capabilities (`file:read`, `file:write`, `network:access`, `renderer:access`, etc.).
- **Sandboxed Error Boundaries**: Safe execution container (`PluginSandbox`) catching third-party plugin throws without breaking the host compiler.
- **Diagnostics & Validation**: `validatePlugin()` static manifest analyzer and SemVer range compatibility checker (`checkVersionCompatibility`).

### Tests
- Total **809/809** tests passing across all 12 completed phases with 0 regressions.

---

## [11.0.0] — Phase 11 — Animation & Presentation Runtime

Date: 2026-07-28

### Added

#### Animation & Presentation Subsystem (`src/animation/`)
- **Animation Directives**: `@animate`, `@keyframes`, `@anim-timeline`, `@slides`, `@slide`, `@note`, `@reveal`, and `@target` native block directives.
- **Keyframe Motion Engine**: CSS `@keyframes` generation from raw percentage declarations (`0% ... 100%`) or 20 built-in keyframe animations (`fadeIn`, `fadeOut`, `slideInUp`, `scaleIn`, `popIn`, `bounceIn`, `pulse`, `shake`, `wobble`, `glow`, `blur`, etc.).
- **Easing & Motion Tokens**: Cubic-bezier resolution for named easings (`spring`, `bounce`, `standard`, `decelerate`, `accelerate`) and CSS custom property design tokens (`--zl-motion-fast`, `--zl-motion-medium`, `--zl-motion-slow`, `--zl-motion-spring`, `--zl-motion-distance-*`).
- **Timeline Sequencing**: Staggered and delay-computed timeline sequences (`@anim-timeline`, `@step`) with highlight and auto-advance controls.
- **Presentation Deck Engine**: Slide deck renderer (`@slides`, `@slide`) with 11 slide layout presets (`title`, `section`, `content`, `comparison`, `code`, `quote`, `closing`, etc.), 16:9 / 4:3 aspect ratios, navigation controls, progress bar, presenter notes (`@note`), and auto-generated slide outline navigation.
- **Accessibility & Reduced Motion**: All animations automatically wrapped in `@media (prefers-reduced-motion: no-preference)` with fallback zero-duration overrides when reduced motion is requested. Full ARIA roles, labels, and keyboard navigation.
- **Diagnostics & Validation**: `validateAnimation()` static analyzer for checking durations, easings, keyframe completeness, duplicate slide IDs, and slide ratios without throwing.

### Tests
- Total **789/789** tests passing across all 11 completed phases with 0 regressions.

---

## [10.0.0] — Phase 10 — Interactive Documents & Educational Features

Date: 2026-07-26

### Added

#### Interactive Engine Subsystem (`src/interactive/`)
- **Interactive Block Directives**: `@interactive`, `@form`, `@quiz`, `@deck`, `@poll`, `@tasks`, `@tabs`, `@accordion`, `@state`, and `@shared` directives.
- **Form Controls**: `@text`, `@email`, `@password`, `@number`, `@search`, `@date`, `@time`, `@textarea`, `@check`, `@radio`, `@select` (single, multi, searchable), `@toggle`, `@switch`, `@segment`, `@slider`, `@progress`, and `@button` (primary, secondary, ghost, danger, outline, icon, loading, disabled).
- **Quiz Engine**: `@quiz` containers with `@mcq`, `@multi`, `@truefalse`, `@blank`, `@match`, `@matrix`, `@hint`, `@explain`, and `@timer`. Pure deterministic scoring engine (`scoreMCQ`, `scoreMulti`, `scoreTrueFalse`, `scoreFillBlank`, `scoreMatching`, `quizScore`).
- **Flashcard Deck Engine**: `@deck` containers with `@card` (front, back, difficulty, tags). Built-in `shuffleCards`, `deckProgress`, `groupByDifficulty`, and `filterByTags` utilities.
- **Poll Engine**: `@poll` containers supporting single, multi, and anonymous polls with vote tallying and progress bar calculations (`tally`).
- **Checklist Engine**: `@tasks` nested checkable item lists.
- **State & Data Bindings**: `@state` and `@shared` blocks compiling to serializable, immutable state maps. Safe `{expr}` text interpolation (`extractBindings`, `interpolateBindings`, `resolveBinding`) with zero `eval` and prototype pollution guards.
- **Accessibility & Security**: Comprehensive ARIA role, label, focus ring, keyboard navigation (`tabindex`), and `@media (prefers-reduced-motion)` styling. Full HTML/XML escaping across all output nodes.
- **Diagnostics**: `validateInteractive()` static validator for detecting missing labels, duplicate field names, invalid slider bounds, missing quiz answers, and unsafe binding expressions.

### Tests
- Total **732/732** tests passing across all 10 completed phases with 0 regressions.

---

## [9.0.0] — Phase 9 — Component, Template & Macro System

Date: 2026-07-26

### Added

#### Component & Template Engine Subsystem (`src/component/`)
- **Component System**: Declarative PascalCase `component Card(title!, variant="default") ... end` definitions and `Card(...) ... end` invocation nodes.
- **Props Engine**: Typed props (`: string`, `: number`, `: bool`, `: enum(...)`, `: array`, `: object`), required props (`!`), default prop values, prop validation, and coercion.
- **Slot & Fill System**: Named slots (`slot header`), default slots, slot fallbacks (`slot default ... end`), slot forwarding (`fill header`), and nested slot resolution.
- **Template System**: Reusable document pattern templates (`template`) with template inheritance (`extends`).
- **Macro System**: Parameterized (`macro note(text)`), text, and inline (`version()`) macros with a 20-level safe recursion cap.
- **Control Flow**: Conditional rendering (`if` / `elseif` / `else`) and loop iteration (`each items as item,index key expr`).
- **Built-in Patterns**: 12 standard built-in component definitions (`Card`, `StatCard`, `FeatureCard`, `AlertBox`, `HeroSection`, `SectionHeader`, `EmptyState`, `InfoPanel`, `ComparePanel`, `CallToAction`, `ProfileCard`, `DashboardTile`).
- **Registry & Diagnostics**: `ComponentRegistry` for resolving document-scoped, imported, and built-in components/templates/macros; `validateComponent()` static validator.

### Tests
- Total **673/673** tests passing across all 9 completed phases with 0 regressions.

---

## [8.0.0] — Phase 8 — Spatial Layout & Canvas Engine

Date: 2026-07-26

### Added

#### Spatial Layout Engine Subsystem (`src/layout/`)
- `@layout` top-level wrapper with `@header`, `@main`, `@footer`, `@sidebar`, `@navigation`, `@section`, `@container`, `@spacer`, and `@box` blocks.
- `@grid` & `@cell` CSS grid layout system with fixed columns, `auto-fit`, `auto-fill`, `min-cell-width`, named `areas`, column spans, row spans, and cell alignment.
- `@flex` & `@item` Flexbox layout system with `row`/`column` directions, `wrap`, `justify`, `align`, `gap`, item `grow`, `shrink`, `basis`, and `align-self`.
- `@stack` layer stacking layout system supporting flow and overlay modes with `z` layer ordering.
- `@canvas` & `@layer` absolute positioning subsystem supporting snapped canvas objects (`@rect`, `@text`, `@image`, `@line`, `@shape`, `@box`), coordinate math, guides, and layer visibility.
- `@pages` & `@page` multi-page document and print layout system supporting A4/Letter/Legal/Custom page dimensions, page margins, bleed, and page breaks (`break=before|after|always`).
- `@presentation` & `@slide` slide deck presentation engine supporting 16:9 and 4:3 ratios, title/content/comparison/gallery/section slide types, speaker notes, and presentation styles.
- `validateLayout()` static validator for detecting invalid directive nesting, grid column overflows, and duplicate element IDs.

---

## [7.0.1] — Chart Rendering Correctness & Deep Bug Fixes

Date: 2026-07-25

### Fixed

#### Chart Engine — Negative Value & Domain Rendering
- **Bar chart** (`renderBarChart`): Bars with negative values previously produced invalid negative SVG `height` attributes. Fixed by computing a signed domain `[min(0, minVal), max(0, maxVal)]` with an explicit zero-baseline axis rule.
- **Horizontal bar chart** (`renderHBarChart`): Applied signed-domain fix to horizontal axis. Negative bars grow leftward from zero-baseline.
- **Line / area / spline / step charts** (`renderLineChart`): Fixed `y`-coordinate computation for negative values. Area charts close to zero-baseline.
- **Scatter / bubble charts** (`renderScatterChart`): Fixed `cy` computation for negative values. Bubble radius uses `Math.abs(val)`.
- **Pie / donut charts** (`renderPieChart`): Skipped zero-value slices. Pie rendering starts at 12 o'clock (`−π/2`).

---

## [7.0.0] — Phase 7 — Native Vector Graphics & Drawing Engine

### Added
- `@vector` declarative drawing engine with scene graphs, shapes, gradients, transforms, and SVG output.
