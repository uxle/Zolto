/**
 * Zolto Language Server Protocol (LSP) Server — Phase 13
 *
 * Implements standard LSP JSON-RPC request dispatcher for IDE integration:
 *   - textDocument/didOpen
 *   - textDocument/didChange
 *   - textDocument/completion
 *   - textDocument/hover
 *   - textDocument/formatting
 *   - textDocument/definition
 *   - textDocument/references
 *   - textDocument/codeAction
 *   - textDocument/documentSymbol
 */

import { DocumentIndexer } from './indexer.js';
import { CompletionEngine } from './completion.js';
import { HoverEngine } from './hover.js';
import { FormatterEngine } from './formatter.js';
import { LinterEngine } from './linter.js';
import { RefactorEngine } from './refactor.js';
import { DiagnosticsEngine } from './diagnostics-engine.js';
import { parse } from '../zolto.js';

export class LspServer {
  constructor(registry = null) {
    this.indexer          = new DocumentIndexer();
    this.completionEngine = new CompletionEngine(this.indexer, registry);
    this.hoverEngine      = new HoverEngine(registry);
    this.formatterEngine  = new FormatterEngine();
    this.linterEngine     = new LinterEngine();
    this.refactorEngine   = new RefactorEngine();
    this.diagnosticsEngine = new DiagnosticsEngine();
    this.documents        = new Map(); // URI -> string content
  }

  handleRequest(method, params = {}) {
    switch (method) {
      case 'initialize':
        return { capabilities: { textDocumentSync: 1, completionProvider: {}, hoverProvider: true, documentFormattingProvider: true } };

      case 'textDocument/didOpen': {
        const uri = params.textDocument?.uri || 'file.zl';
        const text = params.textDocument?.text || '';
        this.documents.set(uri, text);
        const { ast } = parse(text);
        this.indexer.indexDocument(uri, ast);
        return { uri, status: 'opened' };
      }

      case 'textDocument/didChange': {
        const uri = params.textDocument?.uri || 'file.zl';
        const text = params.contentChanges?.[0]?.text || '';
        this.documents.set(uri, text);
        const { ast } = parse(text);
        this.indexer.indexDocument(uri, ast);
        return { uri, status: 'changed' };
      }

      case 'textDocument/completion': {
        const uri = params.textDocument?.uri || 'file.zl';
        const text = this.documents.get(uri) || '';
        const pos = params.position || { line: 1, character: 1 };
        return this.completionEngine.getCompletions(text, { line: pos.line, column: pos.character || pos.column || 1 });
      }

      case 'textDocument/hover': {
        const word = params.word || '@card';
        return this.hoverEngine.getHover(word);
      }

      case 'textDocument/formatting': {
        const uri = params.textDocument?.uri || 'file.zl';
        const text = this.documents.get(uri) || '';
        const formatted = this.formatterEngine.format(text);
        return [{ range: { start: { line: 0, character: 0 }, end: { line: 99999, character: 0 } }, newText: formatted }];
      }

      case 'textDocument/codeAction': {
        const uri = params.textDocument?.uri || 'file.zl';
        const text = this.documents.get(uri) || '';
        const pos = params.range?.start || { line: 1, character: 1 };
        return this.refactorEngine.getCodeActions(text, { line: pos.line, column: pos.character || 1 });
      }

      case 'textDocument/documentSymbol': {
        const uri = params.textDocument?.uri || 'file.zl';
        const index = this.indexer.getIndex(uri);
        return index ? index.symbols : [];
      }

      case 'textDocument/definition': {
        const word = params.word || '';
        const matches = this.indexer.findSymbols(word);
        return matches.length > 0 ? { uri: params.textDocument?.uri || 'file.zl', range: { start: { line: matches[0].line, character: matches[0].column }, end: { line: matches[0].endLine, character: matches[0].endColumn } } } : null;
      }

      case 'textDocument/references': {
        const word = params.word || '';
        const matches = this.indexer.findSymbols(word);
        return matches.map(m => ({ uri: params.textDocument?.uri || 'file.zl', range: { start: { line: m.line, character: m.column }, end: { line: m.endLine, character: m.endColumn } } }));
      }

      default:
        return null;
    }
  }
}
