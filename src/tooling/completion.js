/**
 * Zolto Auto-Completion Engine — Phase 13
 *
 * Context-aware completion suggestions for headings, directives, attributes,
 * component props, math commands, chart fields, diagram nodes, and theme tokens.
 */

import { createCompletionItem } from './ast.js';
import { KNOWN_DIRECTIVES } from '../directive-lexer.js';

export const BUILTIN_DIRECTIVE_SNIPPETS = Object.freeze([
  { label: '@card', detail: 'Card component directive', snippet: '@card title="${1:Title}"\n${0}\n@/card' },
  { label: '@tabs', detail: 'Tab container directive', snippet: '@tabs\n@tab title="${1:Tab 1}"\n${2}\n@/tab\n@/tabs' },
  { label: '@alert', detail: 'Alert banner directive', snippet: '@alert type="${1:info}"\n${0}\n@/alert' },
  { label: '@steps', detail: 'Numbered steps list', snippet: '@steps\n@step\n${1:First step}\n@/step\n@/steps' },
  { label: '@math', detail: 'LaTeX math block', snippet: '@math label="${1:eq1}"\n${0:E = mc^2}\n@/math' },
  { label: '@animate', detail: 'Keyframe animation block', snippet: '@animate name="${1:fadeIn}" duration=${2:300}\nopacity: 0 -> 1\n@/animate' },
  { label: '@slides', detail: 'Presentation slide deck', snippet: '@slides theme="${1:dark}" ratio="16:9"\n@slide title="${2:Intro}"\n# ${3:Slide Title}\n@/slide\n@/slides' },
  { label: '@todo', detail: 'Plugin todo directive', snippet: '@todo status="${1:open}"\n${0:Task description}\n@/todo' },
]);

export const BUILTIN_MATH_COMMANDS = Object.freeze([
  { label: '\\frac', detail: 'Fraction', snippet: '\\frac{${1:num}}{${2:den}}' },
  { label: '\\sqrt', detail: 'Square root', snippet: '\\sqrt{${1:arg}}' },
  { label: '\\sum', detail: 'Summation operator', snippet: '\\sum_{${1:i=1}}^{${2:n}}' },
  { label: '\\int', detail: 'Integral operator', snippet: '\\int_{${1:a}}^{${2:b}}' },
  { label: '\\alpha', detail: 'Greek letter alpha', snippet: '\\alpha' },
  { label: '\\beta', detail: 'Greek letter beta', snippet: '\\beta' },
  { label: '\\theta', detail: 'Greek letter theta', snippet: '\\theta' },
]);

export class CompletionEngine {
  constructor(indexer = null, registry = null) {
    this.indexer  = indexer;
    this.registry = registry;
  }

  /**
   * Get completion items for source text and cursor position.
   * @param {string} text Source line/document text
   * @param {{ line: number, column: number }} position
   * @returns {object[]} Array of CompletionItem AST nodes
   */
  getCompletions(text = '', position = { line: 1, column: 1 }) {
    const items = [];
    const lineText = String(text || '').split('\n')[position.line - 1] || text || '';
    const trimmed = lineText.trim();

    // 1. Math mode completions (\cmd)
    if (/\\$|\\\w*$/.test(lineText)) {
      for (const cmd of BUILTIN_MATH_COMMANDS) {
        items.push(createCompletionItem(cmd.label, 'math', cmd.detail, cmd.snippet, { isSnippet: true }));
      }
      return items;
    }

    // 2. Directives completion (@dir)
    if (trimmed.startsWith('@')) {
      for (const snip of BUILTIN_DIRECTIVE_SNIPPETS) {
        items.push(createCompletionItem(snip.label, 'directive', snip.detail, snip.snippet, { isSnippet: true }));
      }

      // Add registered plugin directives
      if (this.registry && this.registry.directives) {
        for (const name of this.registry.directives.getRegisteredNames()) {
          items.push(createCompletionItem(`@${name}`, 'directive', `Plugin directive @${name}`, `@${name}\n\${0}\n@/${name}`, { isSnippet: true }));
        }
      }
      return items;
    }

    // 3. Document symbols completion from indexer
    if (this.indexer) {
      for (const index of this.indexer.indexes.values()) {
        for (const sym of index.symbols) {
          items.push(createCompletionItem(sym.name, sym.kind, sym.detail, sym.name));
        }
      }
    }

    // Default basic keywords
    items.push(createCompletionItem('# ', 'heading', 'Heading 1', '# ${0}', { isSnippet: true }));
    items.push(createCompletionItem('> [!NOTE]', 'callout', 'Note Callout', '> [!NOTE]\n> ${0}', { isSnippet: true }));

    return items;
  }
}
