# Zolto Specification Roadmap (Phases 1 – 16)

## Phase 1 — Markdown Core ✅

Full CommonMark/GFM-compatible Markdown engine (headings, paragraphs, blockquotes, lists, checklists, links, images, bold, italic, code, tables, frontmatter, variables, footnotes).

## Phase 2 — Extended Markdown Layer ✅

Callouts (`> [!NOTE]`), admonitions (`[info]`), reference links (`[text][id]`), figure captions, definition lists, table captions, code metadata, extended inlines, and static diagnostics.

## Phase 3 — Native Block Directives ✅

14 document component types via universal `@directive` syntax: `@embed`, `@collapse`, `@tabs`, `@card`, `@steps`, `@columns`, `@badge`, `@tag`, `@alert`, `@timeline`, `@progress`, `@avatar`, `@icon`.

## Phase 4 — Native Mathematics Engine ✅

LaTeX-like math syntax with zero external dependencies. Inline `$...$` and block `@math ... @/math`, equation auto-numbering, `@ref()` cross-references, dual HTML + MathML rendering.

## Phase 5 — Native Diagram & Graph Engine ✅

Human-readable, deterministic native diagram engine with 23 diagram types, 8 pluggable layout algorithms (hierarchical, tree, circular, radial, force, grid, orthogonal, manual, sequence), themes (`light`, `dark`, `custom:neo`, `custom:night`), clusters, and responsive SVG rendering.

## Phase 6 — Native Charts & Data Visualization Engine ✅

Native chart engine supporting 24 chart types (`bar`, `hbar`, `line`, `area`, `spline`, `step`, `pie`, `donut`, `scatter`, `bubble`, `radar`, `polararea`, `histogram`, `boxplot`, `candlestick`, `heatmap`, `treemap`, `sunburst`, `funnel`, `waterfall`, `gauge`, `timeline`, `calendar`, `mixed`), statistical calculation engine, multi-format datasets (inline, CSV, TSV, JSON, `$var`), themes, responsive SVG rendering, and static validator.

## Phase 7 — Native Vector Graphics & Drawing Engine ✅

Declarative vector drawing language (`@vector`), scene graph, path language (Move, Line, Curve, Arc), shape primitives (rectangle, circle, ellipse, polygon, bezier, text, image, layer, symbol), transforms (rotate, scale, skew, matrix), gradients (`gradient:id` fill references), shadows, clip paths, and accessible SVG renderer. **601 tests total (cumulative)**.

**Patch v7.0.1** also includes deep bug fixes across the chart engine: signed-domain negative value support for bar, hbar, line, area, spline, step, scatter, and bubble charts; zero-value pie/donut slice skipping; pie chart 12-o'clock start; area chart zero-baseline close; `NaN`/`null` data point filtering; and full `escapeXml()` audit across all three SVG subsystems.

## Phase 8 — Spatial Layout & Canvas Engine ✅

Declarative page and spatial layout system (`@layout`, `@grid`, `@flex`, `@stack`, `@canvas`, `@pages`, `@page`, `@presentation`, `@slide`), responsive grid/flex columns, multi-page print layouts, presentation slide decks, absolute positioning canvas, sticky positioning, z-index layer ordering, and static layout validator. **642 tests total (cumulative)**.

## Phase 9 — Component, Template & Macro System ✅

Reusable abstraction system (`component`, `template`, `macro`, `slot`, `fill`, `if`, `each`), typed props, slot forwarding, fallback slots, logic conditionals (`if`/`elseif`/`else`), loops (`each`), component registry, and 12 built-in patterns (`Card`, `StatCard`, `FeatureCard`, `AlertBox`, `HeroSection`, `SectionHeader`, `EmptyState`, `InfoPanel`, `ComparePanel`, `CallToAction`, `ProfileCard`, `DashboardTile`). **673 tests total (cumulative)**.

## Phase 10 — Interactive Documents & Educational Features ✅

Safe declarative interactive block model (`@interactive`, `@form`, `@quiz`, `@deck`, `@poll`, `@tasks`, `@tabs`, `@accordion`, `@state`, `@shared`), forms, inputs, buttons, toggles, sliders, quizzes, flashcards, polls, pure deterministic scoring engines, state maps, and data bindings without arbitrary scripting. **732 tests total (cumulative)**.

## Phase 11 — Animation & Presentation Runtime ✅

Declarative motion design and presentation runtime system (`@animate`, `@keyframes`, `@anim-timeline`, `@slides`, `@slide`, `@note`, `@reveal`, `@target`), duration & easing controls, motion design tokens, interactive slide decks with presenter notes & outlines, reveal triggers, static diagnostics, and automatic reduced-motion accessibility. **789 tests total (cumulative)**.

## Phase 12 — Plugin API & Extension System ✅

Safe plugin & extension architecture (`PluginRegistry`, `@plugin`, `PluginSandbox`), lifecycle state machine (`load`, `initialize`, `register`, `activate`, `suspend`, `unload`), priority execution hooks (15 extension points), custom directives (`registerDirective`), custom renderers (`registerRenderer`), custom themes (`registerTheme`), data providers (`registerDataProvider`), explicit opt-in permissions, and sandboxed error boundaries. **809 tests total (cumulative)**.

## Phase 13 — Language Server, IDE Tooling & Compiler Optimizations ✅

Complete developer toolchain (`LspServer`, `CompletionEngine`, `HoverEngine`, `DiagnosticsEngine`, `FormatterEngine`, `LinterEngine`, `RefactorEngine`, `DocumentIndexer`, `SearchEngine`, `IncrementalPipeline`, `CacheManager`, `FileWatcher`) supporting full LSP protocol commands, context-aware auto-completion, hover help, non-destructive formatting, configurable linting rules, symbol refactoring, dirty-region incremental parsing & rendering, and layered caching. **829 tests total (cumulative)**.

## Phase 14 — Collaboration, Versioning & Production Ecosystem ✅

Team-grade production ecosystem (`CollaborationEngine`, `CommentEngine`, `VersionHistory`, `BranchEngine`, `WorkspaceManager`, `PackageBuilder`, `PublishingPipeline`, `ExportPipeline`, `AccessControl`, `SyncEngine`, `BackupManager`, `AuditTrail`) supporting real-time presence & live cursors, threaded review comments, version checkpoints & line diffs, branch merge requests, multi-file workspace packaging, production HTML/PDF/SVG/JSON publishing, role-based access control (RBAC), offline delta sync, snapshot recovery, and compliance audit logs. **844 tests total (cumulative)**.

## Phase 15 — Universal Theme & Design System ✅

Universal design system (`ThemeEngine`, `ThemeSwitcher`, `ThemePackageBuilder`, `ThemeAccessibility`, `ThemeValidator`) with built-in **Light**, **Dark**, and **Eye Protection** modes (`#fbf7ee`, `#f3ebd8`, `#2d271e`), CSS design tokens (`--zl-*`), instant runtime theme switching without reloads, portable `.zltheme` package bundles, and WCAG AAA contrast ratio validation. **853 tests total (cumulative)**.

## Phase 16 — v1.0 Stable Release 📋

Feature & API freeze, formal specification, official CLI, security audit, starter templates, production readiness.
