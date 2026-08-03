/**
 * Zolto Vector Graphics Renderer — Phase 7
 *
 * Converts a Vector AST into clean, responsive, accessible, export-ready SVG.
 */

import { renderVectorSvgNode, escapeXml } from './svg.js';
import { THEME_COLOR_TOKENS } from './styles.js';

export function renderVector(vectorAst, opts = {}) {
  if (!vectorAst || vectorAst.type !== 'vector') {
    throw new TypeError('renderVector expected a valid vector AST node (type === "vector")');
  }

  const themeName = vectorAst.theme || 'dark';
  const theme = THEME_COLOR_TOKENS[themeName] || THEME_COLOR_TOKENS.dark;
  const vectorId = opts.id || `vec-${Math.random().toString(36).slice(2, 8)}`;

  const width = vectorAst.width || 800;
  const height = vectorAst.height || 480;
  const viewBox = vectorAst.viewBox || `0 0 ${width} ${height}`;
  const background = vectorAst.background || theme.background;
  const ariaLabel = escapeXml(opts.aria || `Vector Graphic ${vectorId}`);

  const childrenSvg = (vectorAst.children || []).map(child =>
    renderVectorSvgNode(child, themeName, vectorId)
  ).join('\n');

  const gridOverlay = vectorAst.grid ? `
    <defs>
      <pattern id="${vectorId}-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${theme.border}" stroke-width="0.5" opacity="0.4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#${vectorId}-grid)" />` : '';

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg"
     id="${vectorId}"
     class="zl-vector zl-vector-scene"
     viewBox="${viewBox}"
     width="100%"
     role="img"
     aria-label="${ariaLabel}"
     style="max-width: 100%; max-height: 480px; width: auto; height: auto; display: block; margin: 12px auto; background-color: ${background}; font-family: Inter, sans-serif; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
  <title>${ariaLabel}</title>
  ${gridOverlay}
  <g class="zl-vector-viewport">
    ${childrenSvg}
  </g>
</svg>`.trim();

  return svgContent;
}
