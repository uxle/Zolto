# Zolto v1.0 Stable Language Specification

## API & Feature Freeze

As of v1.0.0, the Zolto Core (Parser, Renderer, Plugin API, Theme API, Tooling API, CLI API, and Package format) is officially frozen. Future breaking changes will require a major version bump (e.g., v2.0.0). No new language features will be added to the v1.0 line; only bug fixes, performance optimizations, and security patches.

---

# Accessibility

> **Status:** ARIA attributes, semantic HTML, and screen-reader guidelines

This spec will be written in the phase when the feature is implemented.


---

# Zolto AST Specification

**Version:** 7.0.0

The AST is produced by `src/parser.js` and consumed by `src/renderer.js`
and `src/validator.js`. All nodes are created via `src/ast.js`, `src/diagram/ast.js`, `src/chart/ast.js`, and `src/vector/ast.js` factory functions.

## Phase 7 Vector Nodes

```js
{
  type: 'vector',
  width: number,
  height: number,
  viewBox: string,
  background: string|null,
  theme: string,
  grid: boolean,
  units: string,
  children: VectorNode[]
}
```

## Roadmap AST Node Taxonomy (Phases 1 – 16)

- **Phases 1 & 2**: `document`, `heading`, `paragraph`, `blockquote`, `list`, `list_item`, `task_item`, `code_block`, `table`, `table_row`, `table_cell`, `callout`, `admonition`, `figure`, `definition_list`, `definition_item`, `footnote_def`, `reference_def`, `frontmatter`.
- **Phase 3**: `embed`, `collapse`, `tabs`, `tab`, `card`, `card_group`, `steps`, `step`, `columns`, `column`, `badge`, `tag`, `alert`, `timeline`, `timeline_event`, `progress`, `avatar`, `icon`.
- **Phase 4**: `math_block`, `math_inline`, `Number`, `Identifier`, `Operator`, `UnaryExpression`, `BinaryExpression`, `Fraction`, `Root`, `Power`, `Subscript`, `SubSup`, `Summation`, `Product`, `Integral`, `Limit`, `Matrix`, `FunctionCall`, `Vector`, `Equation`, `EquationGroup`.
- **Phase 5**: `diagram`, `graph`, `node`, `edge`, `cluster`, `group`, `reference`.
- **Phase 6**: `chart`, `chart_dataset`, `chart_series`, `chart_axis`, `chart_legend`, `chart_scale`.
- **Phase 7**: `scene`, `layer`, `shape`, `path`, `transform`, `gradient`, `pattern`, `symbol`, `clip_path`, `mask`.
- **Phase 8**: `layout`, `grid`, `grid_cell`, `flex`, `canvas`, `page`, `header`, `footer`, `slide`.
- **Phase 9**: `component_def`, `component_use`, `template_def`, `template_use`, `slot_def`, `slot_outlet`, `macro_def`, `macro_use`, `conditional_block`, `loop_block`.
- **Phase 10**: `form`, `input`, `textarea`, `button`, `checkbox`, `radio_group`, `select`, `slider`, `toggle`, `quiz`, `mcq`, `flashcard`, `poll`, `interaction_state`.
- **Phase 11**: `animation`, `keyframes`, `motion_token`, `transition`, `timeline_step`, `presentation`, `slide_deck`, `speaker_note`.
- **Phase 12**: `plugin_manifest`, `plugin_dependency`, `plugin_permission`, `extension_point`, `registered_directive`, `registered_renderer`.
- **Phase 13**: `document_index`, `symbol_entry`, `diagnostic_entry`, `completion_item`, `hover_entry`, `refactor_action`, `formatter_hint`.
- **Phase 14**: `collaboration_session`, `presence`, `comment_thread`, `document_version`, `version_diff`, `branch`, `merge_request`, `workspace`, `audit_entry`.
- **Phase 15**: `theme`, `theme_token`, `theme_palette`, `theme_variant`, `theme_override`, `theme_package`.
- **Phase 16**: `specification_manifest`, `cli_config`, `release_metadata`, `starter_template`.

## Document Root

```js
{
  type: 'document',
  children: Node[],
  metadata: {
    title?: string,
    author?: string,
    variables?: Map<string, string>,
    references?: Map<string, { href, title }>
  }
}
```

## Phase 6 Chart Nodes

### chart
```js
{
  type: 'chart',
  chartType: string,    // 24 types: bar, hbar, line, area, spline, step, pie, donut, scatter, bubble, radar, polararea, etc.
  id: string|null,
  title: string|null,
  subtitle: string|null,
  theme: string,        // light, dark, custom:neo, custom:night
  width: number,        // default 800
  height: number,       // default 450
  responsive: boolean,
  animation: boolean,
  legend: boolean,
  colors: string[]|null,
  exportFormat: string, // default 'svg'
  accessibility: boolean,
  aria: string,
  datasets: [ ChartDatasetNode ],
  axes: [ ChartAxisNode ]
}
```

### chart_dataset
```js
{
  type: 'chart_dataset',
  id: string,
  labels: string[],
  series: [ ChartSeriesNode ],
  metadata: Record<string, any>
}
```

### chart_series
```js
{
  type: 'chart_series',
  name: string,
  data: number[],
  color: string|null
}
```

## Phase 5 Diagram Nodes

### diagram
```js
{
  type: 'diagram',
  diagramType: string, // 23 types: flowchart, sequence, state, er, mindmap, etc.
  id: string|null,
  theme: string,       // light, dark, custom:neo, custom:night
  layout: string,      // hierarchical, tree, circular, radial, force, grid, orthogonal, manual
  aria: string|null,
  title: string|null,
  attributes: Record<string, any>,
  children: [ GraphNode ]
}
```

### graph
```js
{
  type: 'graph',
  nodes: DiagramNodeItem[],
  edges: DiagramEdgeNode[],
  groups: GroupNode[],
  clusters: ClusterNode[],
  references: ReferenceNode[]
}
```

### node
```js
{
  type: 'node',
  id: string,
  label: string,
  shape: string,      // rect, circle, diamond, round-rect, hexagon, pill, actor, cylinder
  style: string|null,
  fill: string|null,
  stroke: string|null,
  color: string|null,
  radius: number|null,
  shadow: boolean,
  opacity: number,
  animate: string|null
}
```

### edge
```js
{
  type: 'edge',
  from: string,
  to: string,
  label: string|null,
  style: string,      // solid, dashed
  color: string|null,
  arrow: string,      // filled, hollow, normal, dashed, none
  animate: string|null,
  value: number|null
}
```

### cluster & group
```js
{ type: 'cluster', id: string, label: string, nodeIds: string[], children: Node[] }
{ type: 'group', id: string, label: string, nodeIds: string[] }
```

## Phase 4 Math Nodes

### math_block
```js
{ type: 'math_block', config: string, content: string }
```

## Phase 3 Directive Nodes

`embed`, `collapse`, `tabs`, `tab`, `card`, `card_group`, `steps`, `step`, `columns`, `column`, `badge`, `tag`, `alert`, `timeline`, `timeline_event`, `progress`, `avatar`, `icon`.

## Phase 2 Block Nodes

`callout`, `admonition`, `figure`, `definition_list`, `definition_item`, `reference_def`.


---

# Markdown Compliance

> **Status:** CommonMark and GFM compatibility notes

This spec will be written in the phase when the feature is implemented.


---

# Component System

> **Status:** Component definition syntax and slot system — Phase 4

This spec will be written in the phase when the feature is implemented.


---

# Grammar Rules

> **Status:** Formal grammar rules for Zolto syntax — Phase 5

This spec will be written in the phase when the feature is implemented.


---

# Internationalisation

> **Status:** RTL support, Unicode heading slugs, locale-aware rendering

This spec will be written in the phase when the feature is implemented.


---

# Performance Notes

> **Status:** Parser throughput, renderer benchmarks, and optimisation guide

This spec will be written in the phase when the feature is implemented.


---

# Renderer Reference

> **Status:** HTML output specification for every AST node type — Phase 5

This spec will be written in the phase when the feature is implemented.


---

# Security Guidelines

> **Status:** XSS prevention, sanitisation, and trusted-input policies

This spec will be written in the phase when the feature is implemented.


---

# Zolto Syntax Reference

**Version:** 7.0.0 · Phase 7 · Native Vector Graphics & Drawing Engine

---

## Overview

Zolto is a **strict superset of Markdown**. Every standard `.md` file
is a valid `.zl` file that compiles unchanged.

## Phase 7 Native Vector Syntax

```
@vector [width=N] [height=N] [viewBox="..."] [background="..."] [theme="..."] [grid=true|false] [units="..."]
  rect x=40 y=40 w=240 h=120 radius=16 fill="#1e2230"
  circle cx=80 cy=100 r=24 fill="#7c5cff"
  text x=120 y=100 size=18 fill="#ffffff"
    Hello Zolto
  @endtext
@/vector
```

### Master Language Specification Architecture (Phases 1 – 16)

- **Phase 1 (Markdown Core)**: CommonMark/GFM blocks, inlines, tables, frontmatter, variables.
- **Phase 2 (Extended Markdown)**: Admonitions, callouts (`> [!NOTE]`), footnotes, definition lists, figures.
- **Phase 3 (Block Directives)**: Universal `@directive` syntax (`@card`, `@tabs`, `@alert`, `@steps`, `@timeline`).
- **Phase 4 (Mathematics)**: `$expr$` and `@math ... @/math`, MathML, equation numbering, `@ref()`.
- **Phase 5 (Diagrams)**: `@diagram <type>` (23 diagram types, 9 graph layout strategies, themes, SVG).
- **Phase 6 (Charts)**: `@chart <type>` (24 chart types, inline/CSV/JSON data, statistics, SVG).
- **Phase 7 (Vector Graphics)**: `@vector` declarative drawing, scene graph, path language, transforms.
- **Phase 8 (Spatial Layout)**: `@layout`, `@grid`, `@flex`, `@canvas`, `@page`, multi-page & slide layouts.
- **Phase 9 (Components & Macros)**: `@component`, `@slot`, `@template`, `@macro`, typed props, logic directives (`{#if}`, `{#each}`).
- **Phase 10 (Interactive & Quiz)**: `@interactive`, `@form`, `@quiz`, `@flashcard`, `@poll`, inputs, auto-grading.
- **Phase 11 (Animation & Presentation)**: `@animate`, `@keyframes`, motion tokens, `@presentation`, `@slide`, speaker notes.
- **Phase 12 (Plugin API & Extensions)**: `@plugin` manifest, extension hooks, custom directives/renderers, permissions.
- **Phase 13 (Language Server & Tooling)**: Full LSP, autocomplete, hover, linter, formatter, incremental parsing/rendering.
- **Phase 14 (Collaboration & Versioning)**: Real-time editing, version history, document branching/merging, inline review.
- **Phase 15 (Universal Themes)**: Light, Dark, Eye Protection themes, design tokens, runtime switching.
- **Phase 16 (v1.0 Release)**: Specification, API freeze, official CLI (`zolto`), starter templates, v1.0 LTS launch.

## Phase 6 Native Chart Syntax

```
@chart <type> [title="..."] [subtitle="..."] [theme="..."] [width=N] [height=N] [responsive=true|false] [animation=true|false] [legend=true|false] [colors=[...]]

labels:
  Jan
  Feb
  Mar

data:
  120
  180
  145

@/chart
```

Supported chart types: `bar`, `hbar`, `line`, `area`, `spline`, `step`, `pie`, `donut`, `scatter`, `bubble`, `radar`, `polararea`, `histogram`, `boxplot`, `candlestick`, `heatmap`, `treemap`, `sunburst`, `funnel`, `waterfall`, `gauge`, `timeline`, `calendar`, `mixed`.

## Phase 5 Native Diagram Syntax

```
@diagram <type> [id="..."] [theme="..."] [layout="..."]
  A -> B
@/diagram
```

Supported diagram types: 23 diagram types (`flowchart`, `sequence`, `state`, `er`, `mindmap`, `tree`, `decision`, `org`, `class`, `object`, `package`, `component`, `deployment`, `usecase`, `activity`, `network`, `dependency`, `filesystem`, `git`, `timeline`, `gantt`, `sankey`, `journey`).

## Phase 4 Native Math Syntax

Inline math: `$E = mc^2$`
Block math: `@math ... @/math` with `@ref()` cross-references.

## Phase 2 Block Syntax

### GitHub-style Callouts

```
> [!NOTE]
> Content of the callout.
```

Types: `NOTE` `TIP` `WARNING` `IMPORTANT` `CAUTION` `DANGER`
(case-insensitive). Custom title: `> [!NOTE] My Title`

### Admonition Blocks

```
[info]
Content here — supports **nested markdown**.
[/info]

[warning title="Custom Title"]
Content.
[/warning]
```

24 types: `info` `warning` `tip` `success` `danger` `note`
`definition` `theorem` `proof` `caution` `important` `example`
`question` `bug` `quote` `abstract` `todo` `failure`
`seealso` `summary` `hint` `check` `attention`

### Reference Links

```
[Link text][ref-id]
[ref-id][]          ← shorthand: text used as id

[ref-id]: https://example.com "Optional title"
```

### Table Captions

```
Table: My Caption Text

| Column A | Column B |
| -------- | -------- |
| value    | value    |
```

### Definition Lists

```
Term
: First definition
: Second definition
```

### Code Block Metadata

```
```lang title="filename" {2,4-6} numbers diff
```

Options: `title="…"` `numbers` `{line-ranges}` `diff`

### Standalone Figure

A paragraph containing only a single image becomes a `<figure>`:

```
![Alt text](image.png "Caption text")
```

## Phase 2 Inline Syntax

| Syntax | Output | Description |
|--------|--------|-------------|
| `^text^` | `<sup>` | Superscript |
| `~text~` | `<sub>` | Subscript |
| `==text==` | `<mark>` | Highlight |
| `[[key]]` | `<kbd>` | Keyboard key |
| `&copy;` | `&copy;` | Named HTML entity |
| `&#160;` | NBSP | Decimal entity |
| `&#x2014;` | — | Hex entity |
| `---` | — | Em dash |
| `--` | – | En dash |
| `...` | … | Ellipsis |

## Phase 1 Syntax (inherited, all working)

See `docs/guide/basic-syntax.md` for the complete Phase 1 reference.
