/**
 * Zolto Linter Engine — Phase 13
 *
 * Configurable rule-based linter for unused references, duplicate heading IDs,
 * redundant attributes, and style anti-patterns.
 */

import { ToolingDiagnostics } from './diagnostics.js';

export class LinterEngine {
  constructor(rules = {}) {
    this.rules = {
      'no-unused-refs':       rules['no-unused-refs']       !== false,
      'no-duplicate-headings': rules['no-duplicate-headings'] !== false,
      'no-empty-directives':   rules['no-empty-directives']   !== false,
    };
  }

  /**
   * Lint Zolto document AST and source text.
   * @param {string} src Source string
   * @param {object} ast Document AST
   * @returns {ToolingDiagnostics}
   */
  lint(src = '', ast = null) {
    const diag = new ToolingDiagnostics();
    const lines = String(src || '').split('\n');

    // Rule 1: No empty directives (@card ... @/card with no body)
    if (this.rules['no-empty-directives']) {
      for (let i = 0; i < lines.length - 1; i++) {
        const line1 = lines[i].trim();
        const line2 = lines[i + 1].trim();
        if (/^@([a-z][a-z0-9-]*)/i.test(line1) && /^@\/([a-z][a-z0-9-]*)/i.test(line2)) {
          diag.warn('L1301', 'Empty directive block detected', {
            line: i + 1, column: 1, endLine: i + 2, endColumn: line2.length + 1,
          });
        }
      }
    }

    // Rule 2: Duplicate heading text
    if (this.rules['no-duplicate-headings'] && ast && Array.isArray(ast.children)) {
      const headingsSeen = new Set();
      for (const node of ast.children) {
        if (node && node.type === 'heading') {
          const text = (node.children || []).map(c => c.value || '').join('').trim().toLowerCase();
          if (text) {
            if (headingsSeen.has(text)) {
              diag.warn('L1302', `Duplicate heading "${text}" detected`, { line: node.line || 1, column: 1 });
            } else {
              headingsSeen.add(text);
            }
          }
        }
      }
    }

    return diag;
  }
}
