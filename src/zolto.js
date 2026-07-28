/**
 * Zolto — Public API
 * ════════════════════════════════════════════════════════════════════════════
 * Phase 5 · "Native Diagram & Graph Engine" — High-performance native diagrams,
 * deeply integrated with the Zolto AST foundation.
 *
 *   import { parse, render, compile } from './zolto.js';
 *
 *   const { ast, errors, warnings } = parse(src);
 *   const html = render(ast, { xhtml: false });
 *   const html2 = compile(src);   // parse + render in one call
 *
 * Backward compatible with Phase 1–4 API surface — every prior call site
 * continues to work unchanged.
 */

import { tokenize }      from './lexer.js';
import { parseTokens }   from './parser.js';
import { validate }      from './validator.js';
import { render as renderAst, renderInline, inlineToText } from './renderer.js';
import { Diagnostics }   from './diagnostics.js';
import { parseMath }               from './math-parser.js';
import { renderMathHTML, mathToPlainText } from './math-renderer.js';
import { renderMathML }            from './math-mathml.js';
import { parseDiagram }            from './diagram/parser.js';
import { renderDiagram }          from './diagram/renderer.js';
import { validateDiagram }        from './diagram/validator.js';
import { parseChart }            from './chart/parser.js';
import { renderChart }           from './chart/renderer.js';
import { validateChart }          from './chart/validator.js';
import { parseVector }           from './vector/parser.js';
import { renderVector }          from './vector/renderer.js';
import { validateVector }        from './vector/validator.js';
import { parseLayout }           from './layout/parser.js';
import { renderLayout }          from './layout/renderer.js';
import { validateLayout }        from './layout/validator.js';
import { parseComponent, renderComponent, validateComponent, ComponentRegistry } from './component/index.js';
import { parseInteractive, renderInteractive, validateInteractive } from './interactive/index.js';
import { parseAnimation, renderAnimation, validateAnimation } from './animation/index.js';
import { parsePlugin, renderPluginNode, validatePlugin, PluginRegistry, defaultRegistry, createPluginApi, PluginSandbox, checkVersionCompatibility, parsePluginManifestBlock, parsePluginManifestObject } from './plugin/index.js';
import { createLanguageServer, formatDocument, lintDocument, createDocumentIndexer, searchProject, createIncrementalPipeline, CacheManager } from './tooling/index.js';
import { createCollaborationSession, createVersionHistory, createBranchManager, createWorkspace, publishProject, exportDocument, createAccessControl, createBackupManager, createAuditTrail } from './ecosystem/index.js';
import { createThemeEngine, getThemeTokens, applyTheme, buildThemePackage, validateThemeContrast } from './theme/index.js';

export const VERSION = '15.0.0';
export const PHASE   = 15;

// ─── parse() ──────────────────────────────────────────────────────────────────

/**
 * Parse Zolto/Markdown source into an AST plus diagnostics.
 *
 * @param {string} src  Raw source text
 * @returns {{
 *   ast: DocumentNode,
 *   errors: string[],
 *   warnings: string[],
 *   diagnostics: Diagnostics
 * }}
 */
export function parse(src, options = {}) {
  if (typeof src !== 'string') {
    throw new TypeError(`Zolto.parse: expected string, got ${typeof src}`);
  }

  const { tokens, errors: lexErrors } = tokenize(src, options);
  const ast = parseTokens(tokens, options);

  const { errors: valErrors, warnings, diagnostics } = validate(ast, options);

  const d = new Diagnostics();
  for (const e of lexErrors) d.error('E001', e.message, { line: e.line });
  d.merge(diagnostics);

  return {
    ast,
    errors:   [...lexErrors.map(e => `${e.message} (line ${e.line})`), ...valErrors],
    warnings,
    diagnostics: d,
  };
}

// ─── render() ─────────────────────────────────────────────────────────────────

/**
 * Render a Document AST to an HTML string.
 *
 * @param {DocumentNode} ast
 * @param {object}  [opts]
 * @param {boolean} [opts.xhtml=false]           Self-close void elements (<br />)
 * @param {boolean} [opts.footnoteSection=true]   Append <section class="zl-footnotes">
 * @returns {string}
 */
export function render(ast, opts = {}) {
  if (!ast || ast.type !== 'document') {
    throw new TypeError('Zolto.render: expected a Document AST node (ast.type === "document")');
  }
  return renderAst(ast, opts);
}

// ─── compile() ────────────────────────────────────────────────────────────────

/**
 * Parse + render in a single call.
 *
 * @param {string} src
 * @param {object} [opts]  Same options as render()
 * @returns {string} HTML
 */
export function compile(src, opts = {}) {
  const { ast } = parse(src, opts);
  return render(ast, opts);
}

// ─── Utility re-exports ───────────────────────────────────────────────────────

export { renderInline, inlineToText };

export {
  parseMath as parseMathExpr,
  renderMathHTML as renderMathExpr,
  renderMathML as renderMathExprML,
  mathToPlainText,
};

export {
  parseDiagram,
  renderDiagram,
  validateDiagram,
};

export {
  parseChart,
  renderChart,
  validateChart,
};

export {
  parseVector,
  renderVector,
  validateVector,
};

export {
  parseLayout,
  renderLayout,
  validateLayout,
};

export {
  parseComponent,
  renderComponent,
  validateComponent,
  ComponentRegistry,
};

export {
  parseInteractive,
  renderInteractive,
  validateInteractive,
};

export {
  parseAnimation,
  renderAnimation,
  validateAnimation,
};

export {
  parsePlugin,
  renderPluginNode,
  validatePlugin,
  PluginRegistry,
  defaultRegistry,
  createPluginApi,
  PluginSandbox,
  checkVersionCompatibility,
  parsePluginManifestBlock,
  parsePluginManifestObject,
};

export {
  createLanguageServer,
  formatDocument,
  lintDocument,
  createDocumentIndexer,
  searchProject,
  createIncrementalPipeline,
  CacheManager,
};

export {
  createCollaborationSession,
  createVersionHistory,
  createBranchManager,
  createWorkspace,
  publishProject,
  exportDocument,
  createAccessControl,
  createBackupManager,
  createAuditTrail,
};

export {
  createThemeEngine,
  getThemeTokens,
  applyTheme,
  buildThemePackage,
  validateThemeContrast,
};

/**
 * Library metadata banner.
 * @returns {string}
 */
export function about() {
  return `Zolto v${VERSION} · Phase ${PHASE} · Universal Theme & Design System\n` +
         `  parse(src) → { ast, errors, warnings, diagnostics }\n` +
         `  render(ast, opts?) → html\n` +
         `  compile(src, opts?) → html\n` +
         `  parseDiagram(src, header) → { ast, diagnostics }\n` +
         `  renderDiagram(ast, opts?) → svg\n` +
         `  parseChart(src, header) → { ast, diagnostics }\n` +
         `  renderChart(ast, opts?) → svg\n` +
         `  parseVector(src, header) → { ast, diagnostics }\n` +
         `  renderVector(ast, opts?) → svg\n` +
         `  parseLayout(src, header) → { ast, diagnostics }\n` +
         `  renderLayout(ast, opts?) → html\n` +
         `  parseComponent(src) → { nodes, registry }\n` +
         `  renderComponent(node) → html\n` +
         `  parseInteractive(src) → { nodes, diagnostics }\n` +
         `  renderInteractive(node) → html\n` +
         `  parseAnimation(src, opts?) → { nodes, diagnostics }\n` +
         `  renderAnimation(node) → html\n` +
         `  parsePlugin(src) → { manifest, diagnostics }\n` +
         `  renderPluginNode(node) → html\n` +
         `  createLanguageServer(registry?) → LspServer\n` +
         `  formatDocument(src, opts?) → string\n` +
         `  lintDocument(src, ast?, rules?) → ToolingDiagnostics\n` +
         `  publishProject(src, format?, opts?) → { job, artifact, content }\n` +
         `  applyTheme('light' | 'dark' | 'eyeprotection' | 'custom') → { state, css }`;
}
