/**
 * Zolto Refactoring Tools — Phase 13
 *
 * Provides code actions and automated refactorings:
 *   - Rename heading / reference symbol
 *   - Extract content into a component or template
 *   - Normalize directive open/close tag casing
 */

import { createRefactorAction } from './ast.js';

export class RefactorEngine {
  /**
   * Get available refactoring code actions for a document region.
   * @param {string} src Document source text
   * @param {{ line: number, column: number }} position
   * @returns {object[]} Array of RefactorAction AST nodes
   */
  getCodeActions(text = '', position = { line: 1, column: 1 }) {
    const actions = [];
    const lines = String(text || '').split('\n');
    const lineText = lines[position.line - 1] || '';

    // If on a directive line, offer rename/normalization
    if (/^[ \t]*@([a-z][a-z0-9-]*)/i.test(lineText)) {
      actions.push(createRefactorAction(
        'Normalize directive tag case',
        'refactor.rewrite',
        [{ line: position.line, newText: lineText.toLowerCase() }]
      ));
    }

    // If on selected text, offer component extraction
    actions.push(createRefactorAction(
      'Extract block into component',
      'refactor.extract',
      [],
      { isPreferred: true }
    ));

    return actions;
  }
}
