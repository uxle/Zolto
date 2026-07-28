/**
 * Zolto Tooling Subsystem Entry Point — Phase 13
 *
 * Public API façade for the language server, IDE tools, formatter, linter,
 * indexer, search, caching, and incremental compilation engine.
 */

import { LspServer } from './lsp.js';
import { EditorIntegration } from './editor.js';
import { CompletionEngine } from './completion.js';
import { HoverEngine } from './hover.js';
import { DiagnosticsEngine } from './diagnostics-engine.js';
import { FormatterEngine } from './formatter.js';
import { LinterEngine } from './linter.js';
import { RefactorEngine } from './refactor.js';
import { DocumentIndexer } from './indexer.js';
import { SearchEngine } from './search.js';
import { IncrementalPipeline } from './incremental.js';
import { CacheManager } from './cache.js';
import { FileWatcher } from './watcher.js';
import { TOOLING_NODE_TYPES, isToolingNode } from './ast.js';

export {
  TOOLING_NODE_TYPES,
  isToolingNode,
  LspServer,
  EditorIntegration,
  CompletionEngine,
  HoverEngine,
  DiagnosticsEngine,
  FormatterEngine,
  LinterEngine,
  RefactorEngine,
  DocumentIndexer,
  SearchEngine,
  IncrementalPipeline,
  CacheManager,
  FileWatcher,
};

export function createLanguageServer(registry = null) {
  return new LspServer(registry);
}

export function formatDocument(src, options = {}) {
  const formatter = new FormatterEngine(options);
  return formatter.format(src);
}

export function lintDocument(src, ast = null, rules = {}) {
  const linter = new LinterEngine(rules);
  return linter.lint(src, ast);
}

export function createDocumentIndexer() {
  return new DocumentIndexer();
}

export function searchProject(query, documents, indexer = null) {
  const engine = new SearchEngine(indexer);
  return engine.search(query, documents);
}

export function createIncrementalPipeline(cacheManager = null) {
  return new IncrementalPipeline(cacheManager);
}
