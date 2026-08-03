/**
 * Zolto Layout Engine — Canvas & Absolute Positioning Builder (Phase 8)
 *
 * Computes CSS and DOM representations for @canvas, @layer, and canvas objects.
 */

export function buildCanvasContainerStyles(node) {
  const styles = ['position: relative; overflow: hidden;'];

  const width = typeof node.width === 'number' ? `${node.width}px` : node.width;
  const height = typeof node.height === 'number' ? `${node.height}px` : node.height;

  styles.push(`width: ${width};`);
  styles.push(`height: ${height};`);

  return styles.join(' ');
}

export function buildCanvasLayerStyles(node) {
  const styles = [
    'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
  ];

  if (node.z !== null && node.z !== undefined) {
    styles.push(`z-index: ${node.z};`);
  }

  if (node.visible === false) {
    styles.push('display: none;');
  }

  if (node.locked) {
    styles.push('pointer-events: none;');
  }

  return styles.join(' ');
}

function cleanCssVal(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Truncate at the first character that could break out of this CSS
  // declaration or the surrounding HTML attribute, rather than stripping
  // such characters wherever they occur — stripping alone still lets
  // trailing injected content (e.g. "red; position: fixed") survive as
  // "red position: fixed", just without its separating semicolon.
  const cutIndex = str.search(/[;{}<>"'\\]/);
  const truncated = cutIndex === -1 ? str : str.slice(0, cutIndex);
  return truncated.trim();
}

export function buildCanvasObjectStyles(node) {
  const styles = ['position: absolute;'];

  const x = typeof node.x === 'number' ? `${node.x}px` : cleanCssVal(node.x);
  const y = typeof node.y === 'number' ? `${node.y}px` : cleanCssVal(node.y);

  if (x) styles.push(`left: ${x};`);
  if (y) styles.push(`top: ${y};`);

  if (node.w !== null && node.w !== undefined) {
    const w = typeof node.w === 'number' ? `${node.w}px` : cleanCssVal(node.w);
    styles.push(`width: ${w};`);
  }

  if (node.h !== null && node.h !== undefined) {
    const h = typeof node.h === 'number' ? `${node.h}px` : cleanCssVal(node.h);
    styles.push(`height: ${h};`);
  }

  if (node.z !== null && node.z !== undefined) {
    styles.push(`z-index: ${cleanCssVal(node.z)};`);
  }

  if (node.objectType === 'text') {
    if (node.fill) styles.push(`color: ${cleanCssVal(node.fill)};`);
    if (node.size) styles.push(`font-size: ${typeof node.size === 'number' ? `${node.size}px` : cleanCssVal(node.size)};`);
    if (node.weight) styles.push(`font-weight: ${cleanCssVal(node.weight)};`);
    styles.push('background: transparent;');
  } else {
    if (node.fill) {
      styles.push(`background-color: ${cleanCssVal(node.fill)};`);
    }
  }

  if (node.radius) {
    styles.push(`border-radius: ${typeof node.radius === 'number' ? `${node.radius}px` : cleanCssVal(node.radius)};`);
  }

  return styles.join(' ');
}

export function buildBoxStyles(node) {
  const styles = [];

  const pos = node.position ?? 'static';
  styles.push(`position: ${pos};`);

  if (pos !== 'static') {
    if (node.top !== null) styles.push(`top: ${formatDim(node.top)};`);
    if (node.left !== null) styles.push(`left: ${formatDim(node.left)};`);
    if (node.right !== null) styles.push(`right: ${formatDim(node.right)};`);
    if (node.bottom !== null) styles.push(`bottom: ${formatDim(node.bottom)};`);
    if (node.x !== null) styles.push(`left: ${formatDim(node.x)};`);
    if (node.y !== null) styles.push(`top: ${formatDim(node.y)};`);
  }

  if (node.w !== null) styles.push(`width: ${formatDim(node.w)};`);
  if (node.h !== null) styles.push(`height: ${formatDim(node.h)};`);
  if (node.z !== null) styles.push(`z-index: ${node.z};`);

  return styles.join(' ');
}

function formatDim(val) {
  if (typeof val === 'number') return `${val}px`;
  if (val === 'full') return '100%';
  return val;
}
