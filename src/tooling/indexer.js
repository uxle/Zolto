/**
 * Zolto Document Indexer — Phase 13
 *
 * Fast symbol indexer for document and project-wide lookup. Indexes headings,
 * directives, components, math labels, reference definitions, and theme tokens.
 */

import { createDocumentIndex, createSymbolEntry } from './ast.js';

export class DocumentIndexer {
  constructor() {
    // Map of URI -> DocumentIndex
    this.indexes = new Map();
  }

  /**
   * Index a Document AST and store its DocumentIndex node.
   * @param {string} uri Document URI or path
   * @param {object} ast Document AST
   * @returns {object} DocumentIndex node
   */
  indexDocument(uri, ast) {
    const cleanUri = String(uri || 'untitled.zl');
    if (!ast || !Array.isArray(ast.children)) {
      const emptyIndex = createDocumentIndex(cleanUri);
      this.indexes.set(cleanUri, emptyIndex);
      return emptyIndex;
    }

    const headings   = [];
    const symbols    = [];
    const directives = [];
    const references = [];
    const components = [];
    const labels     = [];

    let lineCounter = 1;

    for (const node of ast.children) {
      if (!node) continue;
      const nodeLine = node.line || lineCounter++;

      if (node.type === 'heading') {
        const text = (node.children || []).map(c => c.value || '').join('');
        const entry = createSymbolEntry(text, 'heading', { line: nodeLine }, { detail: `Level ${node.level}` });
        headings.push(entry);
        symbols.push(entry);
      } else if (node.type === 'reference_def') {
        const entry = createSymbolEntry(node.id, 'reference', { line: nodeLine }, { detail: node.href });
        references.push(entry);
        symbols.push(entry);
      } else if (node.type === 'component_def') {
        const entry = createSymbolEntry(node.name, 'component', { line: nodeLine });
        components.push(entry);
        symbols.push(entry);
      } else if (node.type === 'math_block' && node.label) {
        const entry = createSymbolEntry(node.label, 'math', { line: nodeLine });
        labels.push(entry);
        symbols.push(entry);
      } else if (node.type === 'animation_def' || node.type === 'keyframes_def') {
        const entry = createSymbolEntry(node.name || 'anim', 'directive', { line: nodeLine });
        directives.push(entry);
        symbols.push(entry);
      }
    }

    const index = createDocumentIndex(cleanUri, {
      headings,
      symbols,
      directives,
      references,
      components,
      labels,
      lastIndexed: Date.now(),
    });

    this.indexes.set(cleanUri, index);
    return index;
  }

  getIndex(uri) {
    return this.indexes.get(String(uri || '')) || null;
  }

  findSymbols(query) {
    const q = String(query || '').toLowerCase();
    const matches = [];
    for (const index of this.indexes.values()) {
      for (const sym of index.symbols) {
        if (sym.name.toLowerCase().includes(q)) {
          matches.push(sym);
        }
      }
    }
    return matches;
  }

  clear() {
    this.indexes.clear();
  }
}
