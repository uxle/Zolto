# Troubleshooting

**Version:** 8.0.0 · Common Issues & Solutions

---

## Spatial Layout Issues

### Cell content does not align to grid columns (`@cell`)

**Cause:** `@cell` directive used outside of a `@grid` container.

**Fix:** Ensure `@cell` directives are placed directly inside a `@grid ... @/grid` block:

```zolto
@grid columns=3 gap=16
  @cell
    Content here
  @/cell
@/grid
```

---

### Slide styling not applied (`@slide`)

**Cause:** `@slide` directive used outside of a `@presentation` block.

**Fix:** Ensure `@slide` directives are placed directly inside a `@presentation ... @/presentation` block.

---

### Grid template areas not rendering properly

**Cause:** Multi-line `areas="..."` attribute has unmatched quotes or formatting.

**Fix:** Use standard multi-line string syntax or escaped `\n`:

```zolto
@grid columns=3 areas="header header header
sidebar main main"
  @cell area="header"
    Header
  @/cell
@/grid
```

---

## Chart Issues

### Chart bars appear missing or outside the viewport

**Cause:** All data values are negative. The old renderer used `maxVal` as the scale, producing negative SVG heights.

**Fix (v7.0.1+):** The chart engine now computes a signed domain `[min(0, minValue), max(0, maxValue)]` and draws a zero-baseline axis. Upgrade to v7.0.1 and the bars will render correctly above/below the baseline.

**Verify:**

```zolto
@chart bar title="Negative data test"
labels: A B C
data: -10 -20 -5
@/chart
```

---

### Pie chart is missing slices

**Cause 1:** Some slices have a value of `0`. Zero-angle arcs produce invalid/invisible SVG paths.

**Fix (v7.0.1+):** Zero-value slices are now silently skipped. The remaining slices fill the full circle.

**Cause 2:** Some slices have negative values. Pie charts cannot represent negatives.

**Fix:** Negative values are clamped to `0` automatically. Use a bar or waterfall chart for signed data.

---

### Pie chart starts at 3 o'clock instead of 12 o'clock

**Cause:** Old renderer started at angle `0` (3 o'clock).

**Fix (v7.0.1+):** Pie/donut charts now start at `-π/2` (12 o'clock), which is the standard charting convention. Upgrade to v7.0.1.

---

### Line/area chart data points plot below the chart

**Cause:** Negative values produced `y` coordinates beyond `pad.top + h` (below the chart viewport).

**Fix (v7.0.1+):** Line charts use the signed domain. Negative values now correctly plot below the zero-baseline.

---

### Chart renders as blank (no SVG)

**Cause:** All data values are `NaN`, `null`, or `undefined`, or the data section is completely empty.

**Fix:** Charts with no valid numeric data return an empty string by design. Check that your `data:` section contains at least one real number.

---

## Vector Issues

### Vector gradient fill is not working (`fill="gradient:id"`)

**Cause:** Either the gradient block `id` doesn't match the fill reference, or the gradient block appears after the shape that references it.

**Fix:** Make sure:
1. The `gradient` block is defined **before** the shape using it in the source
2. The `id` in the gradient block exactly matches the ID after `gradient:` in the fill value

```zolto
@vector
gradient id="myGrad" type="linear" x1=0 y1=0 x2=1 y2=0
  stop offset=0 color="#7c5cff"
  stop offset=1 color="#00d4ff"
@endgradient
rect x=10 y=10 w=200 h=100 fill="gradient:myGrad"  ← matches id
@/vector
```

---

### Vector text not rendering

**Cause:** Missing `@endtext` closing tag.

**Fix:** All `text` elements in `@vector` must be closed with `@endtext`:

```zolto
text x=10 y=50 size=18 fill="#ffffff"
  My text content
@endtext
```

---

### Vector produces no output

**Cause:** Syntax error in the vector block (unrecognised keyword, malformed attribute).

**Fix:** Check for diagnostics. The validator emits warnings for unknown shape types and malformed attributes. In the Studio, diagnostics appear in the status bar.

---

## Diagram Issues

### Sequence diagram self-message not visible

**Cause:** `Actor -> Actor: label` (same source and target) produced a zero-length degenerate line.

**Fix (v7.0.1+):** Self-messages now render as a rectangular arc loop to the right of the lifeline, with the label positioned beside it.

```zolto
@diagram sequence
actor Server
Server -> Server: process internally
@/diagram
```

---

### Edge labels not appearing on flowchart

**Cause:** Edge label property was mapped incorrectly in some layout paths.

**Fix (included in v7.0.1):** Edge labels are now correctly mapped from the AST to the SVG text elements in all layout strategies.

---

## General Issues

### `npm run test` says tests fail

1. Run `npm run check` first — a syntax error in any source file can cascade
2. Check Node.js version: `node --version` must be ≥ 20
3. Make sure you're in the project root (where `package.json` lives)

---

### Output contains `undefined` or `NaN`

**Cause:** Usually an AST property that is expected to be a number but received `undefined` due to a parsing miss.

**Fix:** Run the document through the diagnostics API to see what the parser reports:

```javascript
import { parse, render } from './src/zolto.js';
const { ast, diagnostics } = parse(yourSource);
console.log(diagnostics.errors, diagnostics.warnings);
const html = render(ast);
```

---

### Text appears as literal `$formula$` instead of rendered math

**Cause:** Math is only rendered when the `$` tokens are balanced and the content is not preceded by a digit (currency-safe parsing).

**Fix:** Check that:
- The `$` signs are balanced: `$expr$`
- There is no digit immediately before the opening `$`: `$10` stays as text, but `value = $10x$` — wrap carefully

---

*Version: 8.0.0 · See also: [API Reference](../api/index.md) · [Layout Guide](layout.md) · [Charts Guide](charts.md) · [Vector Guide](vector.md)*

