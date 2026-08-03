/**
 * Zolto Layout Engine — Renderer Facade (Phase 8)
 *
 * Renders spatial layout AST nodes into HTML and scoped inline/component CSS styles.
 */

import { LAYOUT_NODE_TYPES } from './ast.js';
import { buildGridStyles, buildCellStyles } from './grid.js';
import { buildFlexStyles, buildFlexItemStyles, buildStackStyles } from './flex.js';
import { buildCanvasContainerStyles, buildCanvasLayerStyles, buildCanvasObjectStyles, buildBoxStyles } from './canvas.js';
import { buildPagesContainerStyles, buildPageStyles } from './pages.js';
import { buildPresentationContainerStyles, buildSlideStyles } from './presentation.js';

/**
 * Render a Spatial Layout AST node to HTML.
 *
 * @param {object} node             Spatial layout AST node
 * @param {function} renderBlockFn  Function to render standard Markdown/child AST blocks
 * @returns {string} HTML string
 */
export function renderLayout(node, renderBlockFn = null) {
  if (!node) return '';

  const renderChild = child => {
    if (!child) return '';
    if (isLayoutNode(child)) {
      return renderLayout(child, renderBlockFn);
    }
    if (renderBlockFn) {
      return renderBlockFn(child);
    }
    return '';
  };

  const renderChildren = (children = []) => children.map(renderChild).filter(Boolean).join('\n');

  switch (node.type) {
    case LAYOUT_NODE_TYPES.LAYOUT: {
      const styles = [];
      styles.push('box-sizing: border-box;');
      styles.push('display: flex; flex-direction: column;');

      const w = typeof node.width === 'number' ? `${node.width}px` : node.width;
      const h = typeof node.height === 'number' ? `${node.height}px` : node.height;
      if (w && w !== 'auto') styles.push(`width: ${w};`);
      if (h && h !== 'auto') styles.push(`height: ${h};`);

      const pad = typeof node.padding === 'number' ? `${node.padding}px` : node.padding;
      const mar = typeof node.margin === 'number' ? `${node.margin}px` : node.margin;
      const gap = typeof node.gap === 'number' ? `${node.gap}px` : node.gap;

      if (pad) styles.push(`padding: ${pad};`);
      if (mar) styles.push(`margin: ${mar};`);
      if (gap) styles.push(`gap: ${gap};`);

      const styleAttr = styles.length ? ` style="${styles.join(' ')}"` : '';
      const themeClass = node.theme ? ` zl-theme-${node.theme}` : '';

      return `<div class="zl-layout-container${themeClass}"${styleAttr}>\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.GRID: {
      const styleStr = buildGridStyles(node);
      return `<div class="zl-layout-grid" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.CELL: {
      const styleStr = buildCellStyles(node);
      const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : '';
      return `<div class="zl-layout-cell"${styleAttr}>\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.FLEX: {
      const styleStr = buildFlexStyles(node);
      return `<div class="zl-layout-flex" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.FLEX_ITEM: {
      const styleStr = buildFlexItemStyles(node);
      return `<div class="zl-layout-item" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.STACK: {
      const styleStr = buildStackStyles(node);
      return `<div class="zl-layout-stack" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.CANVAS: {
      const styleStr = buildCanvasContainerStyles(node);
      const attrSnap = node.snap ? ` data-snap="${escapeHtml(node.snap)}"` : '';
      return `<div class="zl-layout-canvas" style="${escapeHtml(styleStr)}"${attrSnap}>\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.CANVAS_LAYER: {
      const styleStr = buildCanvasLayerStyles(node);
      return `<div class="zl-canvas-layer" id="${escapeHtml(node.id)}" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.CANVAS_OBJECT: {
      const styleStr = buildCanvasObjectStyles(node);
      const innerHtml = renderChildren(node.children);

      if (node.objectType === 'image' && node.src) {
        return `<img class="zl-canvas-image" src="${escapeHtml(node.src)}" style="${escapeHtml(styleStr)}" alt="Canvas object" />`;
      }
      return `<div class="zl-canvas-object zl-canvas-${escapeHtml(node.objectType)}" style="${escapeHtml(styleStr)}">\n${innerHtml}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.PAGES: {
      const styleStr = buildPagesContainerStyles(node);
      const pagesHtml = (node.children ?? []).map(child => {
        if (child?.type === LAYOUT_NODE_TYPES.PAGE) {
          const pageStyleStr = buildPageStyles(child, node);
          const pageNumAttr = child.number ? ` data-page-number="${escapeHtml(child.number)}"` : '';
          return `<div class="zl-layout-page" style="${escapeHtml(pageStyleStr)}"${pageNumAttr}>\n${renderChildren(child.children)}\n</div>`;
        }
        return renderChild(child);
      }).filter(Boolean).join('\n');
      return `<div class="zl-layout-pages zl-pages-size-${escapeHtml(node.size?.toLowerCase())}" style="${escapeHtml(styleStr)}">\n${pagesHtml}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.PAGE: {
      // Reached when a lone @page appears without a @pages wrapper — no
      // parent size/margin to inherit, so fall back to defaults.
      const styleStr = buildPageStyles(node, null);
      const pageNumAttr = node.number ? ` data-page-number="${escapeHtml(node.number)}"` : '';
      return `<div class="zl-layout-page" style="${escapeHtml(styleStr)}"${pageNumAttr}>\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.PRESENTATION: {
      const styleStr = buildPresentationContainerStyles(node);
      const slidesHtml = (node.children ?? []).map(child => {
        if (child?.type === LAYOUT_NODE_TYPES.SLIDE) {
          const slideStyleStr = buildSlideStyles(child, node);
          return `<div class="zl-layout-slide zl-slide-${escapeHtml(child.slideType)}" style="${escapeHtml(slideStyleStr)}">\n${renderChildren(child.children)}\n</div>`;
        }
        return renderChild(child);
      }).filter(Boolean).join('\n');
      return `<div class="zl-layout-presentation zl-pres-theme-${escapeHtml(node.theme)}" style="${escapeHtml(styleStr)}">\n${slidesHtml}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.SLIDE: {
      // Reached when a lone @slide appears without a @presentation wrapper.
      const styleStr = buildSlideStyles(node, null);
      return `<div class="zl-layout-slide zl-slide-${escapeHtml(node.slideType)}" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.HEADER:
      return `<header class="zl-layout-header">\n${renderChildren(node.children)}\n</header>`;

    case LAYOUT_NODE_TYPES.MAIN:
      return `<main class="zl-layout-main">\n${renderChildren(node.children)}\n</main>`;

    case LAYOUT_NODE_TYPES.FOOTER:
      return `<footer class="zl-layout-footer">\n${renderChildren(node.children)}\n</footer>`;

    case LAYOUT_NODE_TYPES.SIDEBAR: {
      const w = typeof node.width === 'number' ? `${node.width}px` : node.width;
      return `<aside class="zl-layout-sidebar" style="width: ${w};">\n${renderChildren(node.children)}\n</aside>`;
    }

    case LAYOUT_NODE_TYPES.NAVIGATION:
      return `<nav class="zl-layout-navigation">\n${renderChildren(node.children)}\n</nav>`;

    case LAYOUT_NODE_TYPES.SECTION: {
      const idAttr = node.id ? ` id="${escapeHtml(node.id)}"` : '';
      return `<section class="zl-layout-section"${idAttr}>\n${renderChildren(node.children)}\n</section>`;
    }

    case LAYOUT_NODE_TYPES.CONTAINER: {
      const w = typeof node.width === 'number' ? `${node.width}px` : node.width;
      const pad = typeof node.padding === 'number' ? `${node.padding}px` : node.padding;
      return `<div class="zl-layout-container-box" style="max-width: ${w}; margin: 0 auto; padding: ${pad};">\n${renderChildren(node.children)}\n</div>`;
    }

    case LAYOUT_NODE_TYPES.SPACER: {
      const sz = typeof node.size === 'number' ? `${node.size}px` : node.size;
      return `<div class="zl-layout-spacer" style="height: ${sz}; width: 100%;"></div>`;
    }

    case LAYOUT_NODE_TYPES.BOX: {
      const styleStr = buildBoxStyles(node);
      return `<div class="zl-layout-box" style="${escapeHtml(styleStr)}">\n${renderChildren(node.children)}\n</div>`;
    }

    default:
      return renderChildren(node.children);
  }
}

export function isLayoutNode(node) {
  return node && typeof node === 'object' && Object.values(LAYOUT_NODE_TYPES).includes(node.type);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string' && typeof str !== 'number') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
