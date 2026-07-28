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
