/**
 * Zolto Hover Information Engine — Phase 13
 *
 * Provides inline hover documentation, code examples, and signature hints
 * for directives, math commands, chart types, diagram types, and components.
 */

import { createHoverEntry } from './ast.js';

export const HOVER_DOCS = Object.freeze({
  '@card':        '**@card** — Card component container directive.\n\n*Attributes:* `title=""`, `variant="default|primary"`\n\n*Example:*\n```zolto\n@card title="Welcome"\n  Card body text.\n@/card\n```',
  '@tabs':        '**@tabs** — Tabbed content container.\n\n*Child directives:* `@tab title="..."`',
  '@alert':       '**@alert** — Alert notification banner.\n\n*Attributes:* `type="info|warning|success|danger"`',
  '@steps':       '**@steps** — Numbered procedural steps container.\n\n*Child directives:* `@step`',
  '@math':        '**@math** — Native LaTeX equation block with auto-numbering and MathML support.\n\n*Attributes:* `label="eq1"`, `title="..."`',
  '@animate':     '**@animate** — Keyframe motion animation directive.\n\n*Attributes:* `name=""`, `duration=300`, `easing="ease-out"`',
  '@slides':      '**@slides** — Presentation slide deck container.\n\n*Attributes:* `theme="dark|light"`, `ratio="16:9|4:3"`',
  '\\frac':       '**\\frac{num}{den}** — Creates a fraction numerator / denominator.',
  '\\sqrt':       '**\\sqrt[n]{arg}** — Square root or nth root operator.',
});

export class HoverEngine {
  constructor(registry = null) {
    this.registry = registry;
  }

  /**
   * Get hover documentation for word under cursor.
   * @param {string} word Word or directive name under cursor
   * @returns {object|null} HoverEntry AST node
   */
  getHover(word = '') {
    if (!word) return null;
    const cleanWord = String(word).trim();

    if (HOVER_DOCS[cleanWord]) {
      return createHoverEntry(HOVER_DOCS[cleanWord]);
    }

    if (cleanWord.startsWith('@')) {
      const dirName = cleanWord.slice(1);
      if (this.registry && this.registry.directives && this.registry.directives.hasDirective(dirName)) {
        return createHoverEntry(`**@${dirName}** — Plugin registered custom directive.`);
      }
      return createHoverEntry(`**${cleanWord}** — Zolto block directive.`);
    }

    if (cleanWord.startsWith('\\')) {
      return createHoverEntry(`**${cleanWord}** — Zolto LaTeX math command.`);
    }

    return null;
  }
}
