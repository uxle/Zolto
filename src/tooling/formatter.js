/**
 * Zolto Formatter Engine — Phase 13
 *
 * Idempotent source code formatter for block directives, attribute alignment,
 * heading normalization, and consistent 2-space indentation.
 */

export class FormatterEngine {
  constructor(options = {}) {
    this.indentWidth = options.indentWidth || 2;
  }

  /**
   * Format Zolto document source string.
   * @param {string} src
   * @returns {string} Formatted source code
   */
  format(src = '') {
    if (!src) return '';
    const lines = String(src).split('\n');
    const formatted = [];
    let indentLevel = 0;

    const openTagRe  = /^[ \t]*@([a-z][a-z0-9-]*)(?:\s+.*)?\s*$/i;
    const closeTagRe = /^[ \t]*@\/([a-z][a-z0-9-]*)\s*$/i;

    // Directives that are always single-line field/metadata declarations —
    // they never have a matching @/tag close, so they must not increment
    // the indent level (unlike true block directives such as @card, @tabs,
    // @form, etc.). Without this, every one of these lines was mistaken
    // for an unclosed block opener, and indentation grew without bound.
    const NON_BLOCK_DIRECTIVES = new Set([
      'text', 'email', 'password', 'number', 'search', 'date', 'time',
      'check', 'toggle', 'switch', 'slider', 'button', 'option',
      'truefalse', 'blank', 'correct', 'choice', 'end', 'item',
    ]);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        formatted.push('');
        continue;
      }

      // Brace-delimited blocks (@form/@quiz/@deck/@poll/@tasks/@accordion
      // and nested @radio/@select/@segment/@mcq/@match option groups) open
      // and close with `{` / `}` rather than `@tag` / `@/tag`. A line that
      // is exactly a closing brace de-indents before it's printed.
      if (trimmed === '}') {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
        continue;
      }

      if (closeTagRe.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
        continue;
      }

      const openMatch = openTagRe.exec(trimmed);
      if (openMatch) {
        formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
        const name = openMatch[1].toLowerCase();
        if (!NON_BLOCK_DIRECTIVES.has(name)) indentLevel++;
        // A brace-delimited block's opening line (e.g. `@form f {` or
        // `@radio plan {`) ends with `{` on the same line — that's a
        // second, independent level of nesting on top of the tag itself.
        if (trimmed.endsWith('{')) indentLevel++;
        continue;
      }

      // Normal line
      formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
    }

    return formatted.join('\n');
  }
}
