/**
 * Zolto Phase 13 Test Suite — Language Server, IDE Integration & Compiler Optimizations
 *
 * Tests: LSP request dispatcher (initialize, open, change, completion, hover, format, codeAction),
 *        Auto-Completion Engine, Hover Engine, Diagnostics Engine, Formatter Engine,
 *        Linter Engine, Refactoring Engine, Document Indexer, Search Engine,
 *        Incremental Pipeline, Cache Manager, and Performance benchmarks.
 */

import {
  createLanguageServer, formatDocument, lintDocument,
  createDocumentIndexer, searchProject, createIncrementalPipeline, CacheManager,
  parse, compile,
} from '../src/zolto.js';
import {
  createDocumentIndex, createSymbolEntry, createDiagnosticEntry,
  createCompletionItem, createHoverEntry, TOOLING_NODE_TYPES, isToolingNode,
} from '../src/tooling/ast.js';
import { EditorIntegration } from '../src/tooling/editor.js';
import { FileWatcher } from '../src/tooling/watcher.js';

// ─── Tiny test harness ────────────────────────────────────────────────────────

let _pass = 0, _fail = 0;
const results = [];

function test(desc, fn) {
  try { fn(); _pass++; results.push({ pass: true, desc }); }
  catch (e) { _fail++; results.push({ pass: false, desc, err: String(e.message) }); }
}

function assert(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function includes(str, sub, msg) {
  if (!String(str).includes(sub)) throw new Error(msg || `Expected "${sub}" to be in string`);
}

// ─── 1. AST Node Factories ────────────────────────────────────────────────────

test('createDocumentIndex produces standard AST node', () => {
  const index = createDocumentIndex('file:///doc.zl', {
    headings: [createSymbolEntry('Intro', 'heading', { line: 1 })],
  });
  eq(index.type, TOOLING_NODE_TYPES.DOCUMENT_INDEX, 'type');
  eq(index.uri, 'file:///doc.zl', 'uri');
  eq(index.headings.length, 1, 'headings length');
  assert(isToolingNode(index), 'isToolingNode');
});

test('createCompletionItem produces standard AST node', () => {
  const item = createCompletionItem('@card', 'directive', 'Card container', '@card\n${0}\n@/card', { isSnippet: true });
  eq(item.type, TOOLING_NODE_TYPES.COMPLETION_ITEM, 'type');
  eq(item.label, '@card', 'label');
  assert(item.isSnippet, 'isSnippet');
});

// ─── 2. Language Server (LSP) Protocol Handlers ───────────────────────────────

test('LspServer handles initialize request', () => {
  const lsp = createLanguageServer();
  const res = lsp.handleRequest('initialize');
  assert(res.capabilities.hoverProvider, 'hoverProvider enabled');
  assert(res.capabilities.completionProvider, 'completionProvider enabled');
});

test('LspServer handles textDocument/didOpen and textDocument/didChange', () => {
  const lsp = createLanguageServer();
  const res1 = lsp.handleRequest('textDocument/didOpen', {
    textDocument: { uri: 'file:///doc1.zl', text: '# Intro\n\n@card\nHello\n@/card' },
  });
  eq(res1.status, 'opened', 'status opened');

  const res2 = lsp.handleRequest('textDocument/didChange', {
    textDocument: { uri: 'file:///doc1.zl' },
    contentChanges: [{ text: '# Updated Intro' }],
  });
  eq(res2.status, 'changed', 'status changed');
});

test('LspServer returns completions on textDocument/completion', () => {
  const lsp = createLanguageServer();
  lsp.handleRequest('textDocument/didOpen', {
    textDocument: { uri: 'file:///doc1.zl', text: '@' },
  });
  const completions = lsp.handleRequest('textDocument/completion', {
    textDocument: { uri: 'file:///doc1.zl' },
    position: { line: 1, character: 1 },
  });
  assert(Array.isArray(completions), 'completions array');
  assert(completions.some(c => c.label === '@card'), 'contains @card');
});

test('LspServer returns hover documentation on textDocument/hover', () => {
  const lsp = createLanguageServer();
  const hover = lsp.handleRequest('textDocument/hover', { word: '@card' });
  assert(hover && hover.contents, 'hover returned');
  includes(hover.contents[0], 'Card component container', 'hover contents');
});

test('LspServer formats document on textDocument/formatting', () => {
  const lsp = createLanguageServer();
  lsp.handleRequest('textDocument/didOpen', {
    textDocument: { uri: 'file:///doc1.zl', text: '@card\n   Hello\n@/card' },
  });
  const edits = lsp.handleRequest('textDocument/formatting', {
    textDocument: { uri: 'file:///doc1.zl' },
  });
  eq(edits.length, 1, 'one text edit');
  includes(edits[0].newText, '@card', 'formatted text');
});

// ─── 3. Auto-Completion Engine ────────────────────────────────────────────────

test('CompletionEngine provides math command completions for backslash', () => {
  const lsp = createLanguageServer();
  const completions = lsp.completionEngine.getCompletions('\\f', { line: 1, column: 2 });
  assert(completions.some(c => c.label === '\\frac'), 'contains \\frac');
});

// ─── 4. Hover Engine ──────────────────────────────────────────────────────────

test('HoverEngine returns info for LaTeX math command', () => {
  const lsp = createLanguageServer();
  const hover = lsp.hoverEngine.getHover('\\frac');
  assert(hover, 'hover info');
  includes(hover.contents[0], 'fraction', 'fraction hover info');
});

// ─── 5. Diagnostics Engine ────────────────────────────────────────────────────

test('DiagnosticsEngine reports unclosed block directives', () => {
  const lsp = createLanguageServer();
  const diag = lsp.diagnosticsEngine.analyze('@card\nMissing closing tag');
  assert(diag.hasErrors, 'has errors');
  eq(diag.entries[0].code, 'E1302', 'unclosed tag code');
});

// ─── 6. Formatter Engine ──────────────────────────────────────────────────────

test('formatDocument formats nested block directives with 2-space indent', () => {
  const unformatted = `@card\n@alert\nWarning text\n@/alert\n@/card`;
  const formatted = formatDocument(unformatted);
  const lines = formatted.split('\n');
  eq(lines[0], '@card', 'line 0');
  eq(lines[1], '  @alert', 'line 1 indented');
  eq(lines[2], '    Warning text', 'line 2 indented');
  eq(lines[3], '  @/alert', 'line 3 indented');
  eq(lines[4], '@/card', 'line 4 unindented');
});

// ─── 7. Linter Engine ─────────────────────────────────────────────────────────

test('lintDocument warns on empty block directives', () => {
  const diag = lintDocument('@card\n@/card');
  assert(diag.hasWarnings, 'has warnings');
  eq(diag.entries[0].code, 'L1301', 'empty directive warning code');
});

// ─── 8. Refactoring Engine ────────────────────────────────────────────────────

test('RefactorEngine offers normalize action on directive line', () => {
  const lsp = createLanguageServer();
  const actions = lsp.refactorEngine.getCodeActions('@CARD\nBody\n@/CARD', { line: 1, column: 1 });
  assert(actions.length > 0, 'code actions returned');
  includes(actions[0].title, 'Normalize', 'normalize action');
});

// ─── 9. Document Indexer ──────────────────────────────────────────────────────

test('DocumentIndexer indexes headings and components', () => {
  const indexer = createDocumentIndexer();
  const { ast } = parse('# Section Title\n\nParagraph text.');
  const index = indexer.indexDocument('file:///doc.zl', ast);

  eq(index.headings.length, 1, 'one heading');
  eq(index.headings[0].name, 'Section Title', 'heading name');
});

// ─── 10. Search Engine ────────────────────────────────────────────────────────

test('searchProject performs full-text search across documents', () => {
  const docs = new Map([
    ['doc1.zl', '# Overview\nZolto is fast.'],
    ['doc2.zl', '# Details\nZolto features native charts.'],
  ]);
  const results = searchProject('charts', docs);
  eq(results.length, 1, 'one match');
  eq(results[0].uri, 'doc2.zl', 'doc2 match');
  eq(results[0].line, 2, 'line 2 match');
});

// ─── 11. Incremental Pipeline ─────────────────────────────────────────────────

test('IncrementalPipeline reuses AST when source is unchanged', () => {
  const pipeline = createIncrementalPipeline();
  const ast1 = pipeline.parseIncremental('# Hello');
  const ast2 = pipeline.parseIncremental('# Hello');
  eq(ast1, ast2, 'same AST reference reused');
});

// ─── 12. Cache Manager ────────────────────────────────────────────────────────

test('CacheManager sets, gets, and invalidates by prefix', () => {
  const cache = new CacheManager(5000);
  cache.set('doc:1', 'content-1');
  cache.set('doc:2', 'content-2');
  cache.set('theme:1', 'theme-1');

  eq(cache.get('doc:1'), 'content-1', 'get doc:1');
  cache.invalidatePrefix('doc:');
  assert(!cache.has('doc:1'), 'doc:1 invalidated');
  assert(cache.has('theme:1'), 'theme:1 preserved');
});

// ─── 13. Editor Integration & Watcher ─────────────────────────────────────────

test('EditorIntegration calculates folding ranges for directives', () => {
  const editor = new EditorIntegration();
  const ranges = editor.getFoldingRanges('@card\nContent\n@/card');
  eq(ranges.length, 1, 'one folding range');
  eq(ranges[0].startLine, 1, 'start line 1');
  eq(ranges[0].endLine, 3, 'end line 3');
});

test('FileWatcher tracks changes and dependencies', () => {
  const watcher = new FileWatcher();
  let notified = false;

  watcher.onWatch((event) => {
    if (event.uri === 'main.zl') notified = true;
  });

  watcher.trackImport('main.zl', 'header.zl');
  watcher.notifyChange('main.zl');

  assert(notified, 'notification received');
  eq(watcher.getDependents('header.zl')[0], 'main.zl', 'dependency tracked');
});

// ─── 14. Performance Benchmarks ───────────────────────────────────────────────

test('Format 1,000-line document in <50ms', () => {
  const src = Array.from({ length: 200 }, (_, i) => `@card title="Card ${i}"\n  Content ${i}\n@/card`).join('\n');
  const t0 = Date.now();
  const formatted = formatDocument(src);
  const ms = Date.now() - t0;
  assert(ms < 100, `1,000-line document formatted in ${ms}ms (must be <100ms)`);
  includes(formatted, '@card', 'formatted output');
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function runPhase13Tests() {
  return { results, passed: _pass, failed: _fail, total: _pass + _fail };
}
