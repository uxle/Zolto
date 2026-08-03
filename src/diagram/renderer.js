/**
 * Zolto Diagram Renderer — Phase 5
 *
 * Converts a Diagram AST into clean, responsive, accessible, export-ready SVG.
 */

import { DiagramGraph } from './graph.js';
import { computeGraphLayout } from './layout/index.js';
import {
  buildSvgMarkers, renderClusterBox, renderEdgePath, renderNodeShape, escapeXml,
} from './svg.js';
import { getTheme } from './themes.js';

/**
 * Renders a Diagram AST node into an SVG string.
 */
export function renderDiagram(diagramAst, opts = {}) {
  if (!diagramAst || diagramAst.type !== 'diagram') {
    throw new TypeError('renderDiagram expected a valid diagram AST node (type === "diagram")');
  }

  const theme = getTheme(diagramAst.theme);
  const graphAstNode = (diagramAst.children ?? []).find(c => c.type === 'graph') ?? { nodes: [], edges: [], clusters: [], references: [] };

  const graph = new DiagramGraph(
    graphAstNode.nodes ?? [],
    graphAstNode.edges ?? [],
    graphAstNode.references ?? []
  );

  const layoutResult = computeGraphLayout(
    graph,
    diagramAst.layout,
    diagramAst.diagramType,
    opts
  );

  const rawDiagramId = diagramAst.id || `diag-${Math.random().toString(36).slice(2, 8)}`;
  const diagramId = escapeXml(rawDiagramId);
  const rawAria = diagramAst.aria || diagramAst.title || `${diagramAst.diagramType} diagram`;
  const ariaLabel = escapeXml(rawAria);
  const diagramType = escapeXml(diagramAst.diagramType);

  // Render clusters
  const clustersHtml = (graphAstNode.clusters ?? []).map(cluster =>
    renderClusterBox(cluster, layoutResult.nodePositions, theme)
  ).join('\n');

  // Render edges
  const edgesHtml = layoutResult.edgePaths.map(edge =>
    renderEdgePath(edge, theme, diagramId)
  ).join('\n');

  // Render nodes
  const nodesHtml = graph.getNodes().map(node => {
    const pos = layoutResult.nodePositions.get(node.id) ?? { x: 0, y: 0, width: 120, height: 45 };
    return renderNodeShape(node, pos, theme, diagramId);
  }).join('\n');

  const markersSvg = buildSvgMarkers(theme, diagramId);

  const svgWidth = layoutResult.width;
  const svgHeight = layoutResult.height;

  // Render sequence lifelines if layout is sequence
  const lifelinesHtml = layoutResult.isSequence
    ? Array.from(layoutResult.nodePositions.values()).map(pos =>
        `<line x1="${pos.cx}" y1="${pos.lifelineY1}" x2="${pos.cx}" y2="${pos.lifelineY2}" stroke="${theme.edgeColor}" stroke-dasharray="4 4" stroke-width="1.5" opacity="0.6" />`
      ).join('\n')
    : '';

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg"
     id="${diagramId}"
     class="zl-diagram zl-diagram-${diagramType}"
     viewBox="0 0 ${svgWidth} ${svgHeight}"
     width="100%"
     role="img"
     aria-label="${ariaLabel}"
     style="max-width: 100%; max-height: 480px; width: auto; height: auto; display: block; margin: 12px auto; background-color: ${theme.background}; font-family: ${theme.fontFamily}; border-radius: 8px;">
  <title>${ariaLabel}</title>
  ${diagramAst.aria ? `<desc>${escapeXml(diagramAst.aria)}</desc>` : ''}
  ${markersSvg}
  <g class="zl-diagram-viewport">
    <g class="zl-diagram-clusters">${clustersHtml}</g>
    ${lifelinesHtml ? `<g class="zl-diagram-lifelines">${lifelinesHtml}</g>` : ''}
    <g class="zl-diagram-edges">${edgesHtml}</g>
    <g class="zl-diagram-nodes">${nodesHtml}</g>
  </g>
</svg>`.trim();

  return svgContent;
}
