/**
 * Zolto Tooling AST Node Factories — Phase 13
 *
 * Monomorphic AST node factories for document index, symbol entries,
 * diagnostic entries, completion items, hover entries, refactor actions,
 * formatter hints, cache entries, watch events, and tooling state.
 *
 * Contract:
 *   - All fields are present on every node (no missing keys)
 *   - Missing optional values use null, not undefined
 *   - Collections use arrays, never null
 */

export const TOOLING_NODE_TYPES = Object.freeze({
  DOCUMENT_INDEX:   'document_index',
  SYMBOL_ENTRY:     'symbol_entry',
  DIAGNOSTIC_ENTRY: 'diagnostic_entry',
  COMPLETION_ITEM:  'completion_item',
  HOVER_ENTRY:      'hover_entry',
  REFACTOR_ACTION:  'refactor_action',
  FORMATTER_HINT:   'formatter_hint',
  CACHE_ENTRY:      'cache_entry',
  WATCH_EVENT:      'watch_event',
  TOOLING_STATE:    'tooling_state',
});

// ─── Node Factories ───────────────────────────────────────────────────────────

export function createDocumentIndex(uri, meta = {}) {
  return {
    type:         TOOLING_NODE_TYPES.DOCUMENT_INDEX,
    uri:          String(uri || ''),
    headings:     Array.isArray(meta.headings) ? meta.headings : [],
    symbols:      Array.isArray(meta.symbols) ? meta.symbols : [],
    directives:   Array.isArray(meta.directives) ? meta.directives : [],
    references:   Array.isArray(meta.references) ? meta.references : [],
    components:   Array.isArray(meta.components) ? meta.components : [],
    labels:       Array.isArray(meta.labels) ? meta.labels : [],
    lastIndexed:  meta.lastIndexed != null ? Number(meta.lastIndexed) : Date.now(),
  };
}

export function createSymbolEntry(name, kind, location, meta = {}) {
  return {
    type:        TOOLING_NODE_TYPES.SYMBOL_ENTRY,
    name:        String(name || ''),
    kind:        String(kind || 'variable'), // 'heading', 'directive', 'component', 'reference', 'math'
    line:        location?.line != null ? Number(location.line) : 1,
    column:      location?.column != null ? Number(location.column) : 1,
    endLine:     location?.endLine != null ? Number(location.endLine) : 1,
    endColumn:   location?.endColumn != null ? Number(location.endColumn) : 1,
    detail:      meta.detail ? String(meta.detail) : null,
    container:   meta.container ? String(meta.container) : null,
  };
}

export function createDiagnosticEntry(code, message, severity, location, meta = {}) {
  return {
    type:       TOOLING_NODE_TYPES.DIAGNOSTIC_ENTRY,
    code:       String(code || 'E1300'),
    message:    String(message || ''),
    severity:   String(severity || 'error'), // 'error', 'warning', 'info', 'hint'
    line:       location?.line != null ? Number(location.line) : 1,
    column:     location?.column != null ? Number(location.column) : 1,
    endLine:    location?.endLine != null ? Number(location.endLine) : 1,
    endColumn:  location?.endColumn != null ? Number(location.endColumn) : 1,
    fix:        meta.fix || null,
  };
}

export function createCompletionItem(label, kind, detail = null, snippet = null, meta = {}) {
  return {
    type:             TOOLING_NODE_TYPES.COMPLETION_ITEM,
    label:            String(label || ''),
    kind:             String(kind || 'text'), // 'directive', 'property', 'value', 'snippet', 'keyword'
    detail:           detail ? String(detail) : null,
    insertText:       snippet ? String(snippet) : String(label || ''),
    isSnippet:        meta.isSnippet === true,
    documentation:   meta.documentation ? String(meta.documentation) : null,
    sortText:        meta.sortText ? String(meta.sortText) : String(label || ''),
  };
}

export function createHoverEntry(contents, range = null) {
  return {
    type:     TOOLING_NODE_TYPES.HOVER_ENTRY,
    contents: Array.isArray(contents) ? contents.map(String) : [String(contents || '')],
    range:    range || null,
  };
}

export function createRefactorAction(title, kind, edits = [], meta = {}) {
  return {
    type:        TOOLING_NODE_TYPES.REFACTOR_ACTION,
    title:       String(title || ''),
    kind:        String(kind || 'refactor'), // 'refactor.rename', 'refactor.extract'
    edits:       Array.isArray(edits) ? edits : [],
    isPreferred: meta.isPreferred === true,
  };
}

export function createFormatterHint(rule, line, meta = {}) {
  return {
    type:    TOOLING_NODE_TYPES.FORMATTER_HINT,
    rule:    String(rule || 'indent'),
    line:    Number(line || 1),
    suggest: meta.suggest ? String(meta.suggest) : null,
  };
}

export function createCacheEntry(key, value, ttlMs = 300000) {
  return {
    type:      TOOLING_NODE_TYPES.CACHE_ENTRY,
    key:       String(key || ''),
    value:     value,
    timestamp: Date.now(),
    expiresAt: Date.now() + Number(ttlMs),
  };
}

export function createWatchEvent(uri, eventType) {
  return {
    type:      TOOLING_NODE_TYPES.WATCH_EVENT,
    uri:       String(uri || ''),
    eventType: String(eventType || 'change'), // 'create', 'change', 'delete'
    timestamp: Date.now(),
  };
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

const _ALL_TOOLING_TYPES = new Set(Object.values(TOOLING_NODE_TYPES));

export function isToolingNode(node) {
  return node != null && typeof node === 'object' && _ALL_TOOLING_TYPES.has(node.type);
}
