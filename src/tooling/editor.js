/**
 * Zolto IDE Editor Integration — Phase 13
 *
 * Provides editor-agnostic syntax highlighting tokens, bracket matching pairs,
 * code folding ranges, and document outline trees for VS Code, Neovim, Helix, etc.
 */

export class EditorIntegration {
  /**
   * Get folding ranges for document directives and code blocks.
   * @param {string} src Document source
   * @returns {Array<{ startLine: number, endLine: number }>}
   */
  getFoldingRanges(src = '') {
    const ranges = [];
    const lines = String(src || '').split('\n');
    const stack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const openMatch = /^[ \t]*@([a-z][a-z0-9-]*)/i.exec(line);
      const closeMatch = /^[ \t]*@\/([a-z][a-z0-9-]*)/i.exec(line);

      if (openMatch && !closeMatch) {
        stack.push(i + 1);
      } else if (closeMatch && stack.length > 0) {
        const start = stack.pop();
        ranges.push({ startLine: start, endLine: i + 1 });
      }
    }

    return ranges;
  }
}
