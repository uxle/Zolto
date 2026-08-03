/**
 * Zolto SVG DOM Builder & Elements Generator — Phase 5
 *
 * Generates clean, semantic, accessible, high-DPI responsive SVG DOM elements.
 */

export function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates SVG Arrowhead and Marker definitions.
 */
export function buildSvgMarkers(theme, diagramId) {
  const edgeColor = theme.edgeColor;
  const accentColor = theme.accentColor;
  const prefix = diagramId ? `${diagramId}-` : '';

  return `
  <defs>
    <!-- Filled Arrowhead -->
    <marker id="${prefix}arrow-filled" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="${edgeColor}" />
    </marker>
    <!-- Hollow Arrowhead -->
    <marker id="${prefix}arrow-hollow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="${theme.background}" stroke="${edgeColor}" stroke-width="1.5" />
    </marker>
    <!-- Drop Shadow Filter -->
    <filter id="${prefix}shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.15)" />
    </filter>
  </defs>`.trim();
}

/**
 * Generates SVG Shape path/rect/circle for a diagram node.
 */
export function renderNodeShape(node, pos, theme, diagramId) {
  const shape = (node.shape || 'rect').toLowerCase();
  const fill = node.fill || (node.style === 'primary' ? theme.accentColor : theme.nodeFill);
  const stroke = node.stroke || theme.nodeStroke;
  const textColor = node.color || (node.style === 'primary' ? '#ffffff' : theme.textColor);
  const radius = node.radius ?? theme.nodeRadius;
  const shadowAttr = node.shadow || theme.shadow ? `filter="url(#${diagramId ? `${diagramId}-` : ''}shadow)"` : '';

  const { x, y, width, height } = pos;
  const cx = x + width / 2;
  const cy = y + height / 2;

  let shapeElement = '';

  if (shape === 'circle') {
    const r = Math.min(width, height) / 2;
    shapeElement = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr} />`;
  } else if (shape === 'diamond') {
    const points = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
    shapeElement = `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr} />`;
  } else if (shape === 'round-rect' || shape === 'rect') {
    const rVal = shape === 'round-rect' ? radius : 2;
    shapeElement = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rVal}" ry="${rVal}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr} />`;
  } else if (shape === 'pill') {
    const rVal = height / 2;
    shapeElement = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rVal}" ry="${rVal}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr} />`;
  } else if (shape === 'actor') {
    // Stick figure for actor
    const headR = 10;
    shapeElement = `
      <g stroke="${stroke}" stroke-width="2" fill="${fill}" ${shadowAttr}>
        <circle cx="${cx}" cy="${y + 12}" r="${headR}" />
        <line x1="${cx}" y1="${y + 22}" x2="${cx}" y2="${y + 36}" />
        <line x1="${cx - 12}" y1="${y + 26}" x2="${cx + 12}" y2="${y + 26}" />
        <line x1="${cx}" y1="${y + 36}" x2="${cx - 10}" y2="${y + 48}" />
        <line x1="${cx}" y1="${y + 36}" x2="${cx + 10}" y2="${y + 48}" />
      </g>`.trim();
  } else if (shape === 'hexagon') {
    const points = `${x + width * 0.25},${y} ${x + width * 0.75},${y} ${x + width},${cy} ${x + width * 0.75},${y + height} ${x + width * 0.25},${y + height} ${x},${cy}`;
    shapeElement = `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr} />`;
  } else if (shape === 'cylinder') {
    const ry = 8;
    shapeElement = `
      <g fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr}>
        <path d="M ${x} ${y + ry} L ${x} ${y + height - ry} A ${width / 2} ${ry} 0 0 0 ${x + width} ${y + height - ry} L ${x + width} ${y + ry} Z" />
        <ellipse cx="${cx}" cy="${y + ry}" rx="${width / 2}" ry="${ry}" />
        <ellipse cx="${cx}" cy="${y + height - ry}" rx="${width / 2}" ry="${ry}" fill="none" />
      </g>`.trim();
  } else {
    // Default rect
    shapeElement = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.nodeStrokeWidth}" ${shadowAttr} />`;
  }

  // Label text
  const labelText = escapeXml(node.label || node.id);
  const textElement = `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="${theme.fontFamily}" font-size="${theme.fontSize}" font-weight="${theme.fontWeight}" fill="${textColor}">${labelText}</text>`;

  return `
  <g class="zl-diagram-node" id="zl-node-${escapeXml(node.id)}" data-node-id="${escapeXml(node.id)}">
    ${shapeElement}
    ${textElement}
  </g>`.trim();
}

/**
 * Generates SVG path element for a graph edge connector.
 */
export function renderEdgePath(edge, theme, diagramId) {
  if (!edge.path) return '';

  const color = edge.color || theme.edgeColor;
  const styleStr = edge.style === 'dashed' ? 'stroke-dasharray="6,4"' : '';
  const markerAttr = edge.arrow !== 'none' ? `marker-end="url(#${diagramId ? `${diagramId}-` : ''}arrow-filled)"` : '';

  const pathEl = `<path d="${edge.path}" fill="none" stroke="${color}" stroke-width="${theme.edgeWidth}" ${styleStr} ${markerAttr} />`;

  let labelEl = '';
  if (edge.label) {
    const lx = edge.labelX ?? 0;
    const ly = edge.labelY ?? 0;
    const labelText = escapeXml(edge.label);
    const bgWidth = labelText.length * 8 + 12;

    labelEl = `
      <g class="zl-diagram-edge-label">
        <rect x="${lx - bgWidth / 2}" y="${ly - 10}" width="${bgWidth}" height="18" rx="4" fill="${theme.background}" stroke="${theme.nodeStroke}" stroke-width="1" />
        <text x="${lx}" y="${ly + 3}" text-anchor="middle" font-family="${theme.fontFamily}" font-size="11" font-weight="500" fill="${theme.textColor}">${labelText}</text>
      </g>`.trim();
  }

  return `
  <g class="zl-diagram-edge">
    ${pathEl}
    ${labelEl}
  </g>`.trim();
}

/**
 * Renders cluster bounding container box.
 */
export function renderClusterBox(cluster, posMap, theme) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const nodeId of cluster.nodeIds) {
    const pos = posMap.get(nodeId);
    if (pos) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + pos.height);
    }
  }

  if (minX === Infinity) return '';

  const pad = 20;
  const x = minX - pad;
  const y = minY - pad - 20;
  const w = (maxX - minX) + pad * 2;
  const h = (maxY - minY) + pad * 2 + 20;

  const titleText = escapeXml(cluster.label || cluster.id);

  return `
  <g class="zl-diagram-cluster" id="zl-cluster-${escapeXml(cluster.id)}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${theme.surface}" stroke="${theme.accentColor}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.85" />
    <text x="${x + 12}" y="${y + 18}" font-family="${theme.fontFamily}" font-size="12" font-weight="600" fill="${theme.accentColor}">${titleText}</text>
  </g>`.trim();
}
