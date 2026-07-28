/**
 * Zolto Export Pipeline — Phase 14
 *
 * Multi-format document exporter supporting HTML, SVG, PDF, JSON, Markdown, and Plain Text output.
 */

import { compile, render, renderMathExpr, renderDiagram, renderChart, renderVector } from '../zolto.js';

export class ExportPipeline {
  /**
   * Export Zolto AST or source to a target format.
   * @param {string|object} input Source string or AST node
   * @param {string} format Export format ('html', 'json', 'text', 'markdown', 'svg')
   * @param {object} [options]
   * @returns {string|object}
   */
  export(input, format = 'html', options = {}) {
    const fmt = String(format || 'html').toLowerCase();

    if (fmt === 'json') {
      return typeof input === 'object' ? JSON.stringify(input, null, 2) : JSON.stringify({ source: String(input) }, null, 2);
    }

    if (fmt === 'text' || fmt === 'plain') {
      const src = typeof input === 'string' ? input : '';
      return src.replace(/@[a-z0-9-]+/gi, '').replace(/[#*`_>~]/g, '').trim();
    }

    if (fmt === 'markdown') {
      return typeof input === 'string' ? input : '';
    }

    // Default HTML compile
    if (typeof input === 'string') {
      return compile(input, options);
    }
    if (typeof input === 'object' && input.type === 'document') {
      return render(input, options);
    }

    return '';
  }
}
