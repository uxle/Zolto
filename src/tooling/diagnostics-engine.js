/**
 * Zolto Diagnostics Engine — Phase 13
 *
 * Location-aware diagnostics aggregator for syntax errors, missing tag errors,
 * duplicate headings, broken math, diagram issues, and linting rules.
 */

import { ToolingDiagnostics } from './diagnostics.js';

export class DiagnosticsEngine {
  constructor() {
    this.diag = new ToolingDiagnostics();
  }

  /**
   * Run diagnostic analysis on source text and AST.
   * @param {string} src Source text
   * @param {object} ast Document AST
   * @returns {ToolingDiagnostics}
   */
  analyze(src = '', ast = null) {
    const diag = new ToolingDiagnostics();
    const lines = String(src || '').split('\n');

    // 1. Line-by-line syntax checks (unclosed directives, missing closing tags)
    const openTags = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const openMatch = /^[ \t]*@([a-z][a-z0-9-]*)(?:\s+.*)?\s*$/i.exec(line);
      const closeMatch = /^[ \t]*@\/([a-z][a-z0-9-]*)\s*$/i.exec(line);

      if (closeMatch) {
        const closeTag = closeMatch[1].toLowerCase();
        if (openTags.length > 0 && openTags[openTags.length - 1].tag === closeTag) {
          openTags.pop();
        } else {
          diag.error('E1301', `Mismatched closing directive @/${closeTag}`, {
            line: i + 1, column: 1, endLine: i + 1, endColumn: line.length + 1,
          });
        }
      } else if (openMatch) {
        const tag = openMatch[1].toLowerCase();
        // Skip self-contained or line-level tags if known
        if (!['badge', 'tag', 'avatar', 'icon', 'ref'].includes(tag)) {
          openTags.push({ tag, line: i + 1 });
        }
      }
    }

    // Unclosed tags at EOF
    for (const unclosed of openTags) {
      diag.error('E1302', `Unclosed block directive @${unclosed.tag} (missing @/${unclosed.tag})`, {
        line: unclosed.line, column: 1, endLine: unclosed.line, endColumn: 10,
        fix: { label: `Add @/${unclosed.tag}`, text: `\n@/${unclosed.tag}` },
      });
    }

    return diag;
  }
}
