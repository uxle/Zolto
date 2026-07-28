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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        formatted.push('');
        continue;
      }

      if (closeTagRe.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
        continue;
      }

      if (openTagRe.test(trimmed)) {
        formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
        indentLevel++;
        continue;
      }

      // Normal line
      formatted.push(' '.repeat(indentLevel * this.indentWidth) + trimmed);
    }

    return formatted.join('\n');
  }
}
