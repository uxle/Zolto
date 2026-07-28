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
