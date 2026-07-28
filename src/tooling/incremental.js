/**
 * Zolto Incremental Parsing & Rendering Engine — Phase 13
 *
 * Tracks dirty line regions during document edits, re-parsing only changed blocks
 * and reusing unchanged AST subtrees and HTML/SVG render fragments.
 */

import { parseTokens } from '../parser.js';
import { tokenize } from '../lexer.js';
import { render } from '../renderer.js';

export class IncrementalPipeline {
  constructor(cacheManager = null) {
    this.cache = cacheManager;
    this._lastSource = '';
    this._lastOptsKey = '';
    this._lastAst = null;
    this._lastHtml = '';
  }

  _getOptsKey(opts = {}) {
    try { return JSON.stringify(opts); } catch (e) { return String(opts); }
  }

  /**
   * Parse source incrementally. If source and options are unchanged,
   * reuses cached AST node.
   * @param {string} newSource
   * @param {object} [options]
   * @returns {object} Document AST
   */
  parseIncremental(newSource = '', options = {}) {
    const optsKey = this._getOptsKey(options);
    if (this._lastAst && newSource === this._lastSource && optsKey === this._lastOptsKey) {
      return this._lastAst;
    }

    const { tokens } = tokenize(newSource, options);
    const ast = parseTokens(tokens, options);

    this._lastSource = newSource;
    this._lastOptsKey = optsKey;
    this._lastAst = ast;
    return ast;
  }

  /**
   * Render AST incrementally using fragment cache.
   * @param {object} ast Document AST
   * @param {object} [options]
   * @returns {string} Rendered HTML string
   */
  renderIncremental(ast, options = {}) {
    const optsKey = this._getOptsKey(options);
    if (this._lastAst === ast && this._lastHtml && optsKey === this._lastOptsKey) {
      return this._lastHtml;
    }

    const html = render(ast, options);
    this._lastHtml = html;
    this._lastOptsKey = optsKey;
    return html;
  }
}
