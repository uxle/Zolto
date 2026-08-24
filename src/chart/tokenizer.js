/**
 * Zolto Chart Tokenizer — Phase 6
 *
 * Tokenizes native `@chart <type> ... @/chart` content into typed tokens.
 */

export const ChartTokenType = Object.freeze({
  OPEN_CHART:   'OPEN_CHART',   // @chart
  CLOSE_CHART:  'CLOSE_CHART',  // @/chart
  CHART_TYPE:   'CHART_TYPE',   // bar, line, pie, etc.
  SECTION_HEADER: 'SECTION_HEADER', // labels:, data:, series:, xaxis:, yaxis:, etc.
  KEYWORD:      'KEYWORD',      // dataset, source, transform, stats, style, etc.
  IDENTIFIER:   'IDENTIFIER',
  STRING:       'STRING',
  NUMBER:       'NUMBER',
  BOOLEAN:      'BOOLEAN',      // true, false
  EQUALS:       'EQUALS',       // =
  COLON:        'COLON',        // :
  COMMA:        'COMMA',        // ,
  LBRACKET:     'LBRACKET',     // [
  RBRACKET:     'RBRACKET',     // ]
  LBRACE:       'LBRACE',       // {
  RBRACE:       'RBRACE',       // }
  HYPHEN:       'HYPHEN',       // -
  VARIABLE_REF: 'VARIABLE_REF', // $variable_name
  NEWLINE:      'NEWLINE',
  EOF:          'EOF',
});

const KNOWN_SECTIONS = new Set([
  'labels:', 'data:', 'series:', 'points:', 'candles:', 'rows:', 'nodes:',
  'stages:', 'steps:', 'events:', 'xaxis:', 'yaxis:', 'axes:', 'legend:',
  'tooltip:', 'style:', 'animation:', 'export:', 'transform:', 'stats:',
  'accessibility:', 'source:', 'dataset:', 'metadata:'
]);

export function tokenizeChart(sourceStr) {
  const lines = sourceStr.split(/\r?\n/);
  const tokens = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const lineNum = lineIdx + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith('//') || line.startsWith('#')) {
      continue;
    }

    if (/^@\/chart\s*$/.test(line)) {
      tokens.push({ type: ChartTokenType.CLOSE_CHART, line: lineNum, column: 1, raw: line });
      continue;
    }

    let col = 1;
    let i = 0;

    if (line.startsWith('@chart')) {
      tokens.push({ type: ChartTokenType.OPEN_CHART, line: lineNum, column: 1, raw: '@chart' });
      i += 6;
      col += 6;
    }

    while (i < line.length) {
      // Skip whitespace
      while (i < line.length && /[ \t]/.test(line[i])) {
        i++;
        col++;
      }
      if (i >= line.length) break;

      const char = line[i];

      // Comment
      if (line.slice(i, i + 2) === '//') {
        break;
      }

      // Check for Section Header (e.g. labels:, data:, series:, xaxis:, yaxis:, legend:)
      const lineRem = line.slice(i);
      const secMatch = lineRem.match(/^(labels|data|series|points|candles|rows|nodes|stages|steps|events|xaxis|yaxis|axes|legend|tooltip|style|animation|export|transform|stats|accessibility|source|dataset|metadata):/i);
      if (secMatch) {
        const fullSec = secMatch[0].toLowerCase();
        tokens.push({ type: ChartTokenType.SECTION_HEADER, value: fullSec, raw: secMatch[0], line: lineNum, column: col });
        i += secMatch[0].length;
        col += secMatch[0].length;
        continue;
      }

      // Variable Reference $variable_name
      if (char === '$') {
        const varMatch = lineRem.match(/^\$[a-zA-Z0-9_]+/);
        if (varMatch) {
          tokens.push({ type: ChartTokenType.VARIABLE_REF, value: varMatch[0].slice(1), raw: varMatch[0], line: lineNum, column: col });
          i += varMatch[0].length;
          col += varMatch[0].length;
          continue;
        }
      }

      // Strings (single or double quoted)
      if (char === '"' || char === "'") {
        const quote = char;
        let strVal = '';
        let startCol = col;
        i++; col++;
        while (i < line.length && line[i] !== quote) {
          if (line[i] === '\\' && i + 1 < line.length) {
            strVal += line[i + 1];
            i += 2; col += 2;
          } else {
            strVal += line[i];
            i++; col++;
          }
        }
        if (i < line.length && line[i] === quote) {
          i++; col++;
        }
        tokens.push({ type: ChartTokenType.STRING, value: strVal, line: lineNum, column: startCol });
        continue;
      }

      // Punctuation
      if (char === '[') { tokens.push({ type: ChartTokenType.LBRACKET, value: '[', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ']') { tokens.push({ type: ChartTokenType.RBRACKET, value: ']', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '{') { tokens.push({ type: ChartTokenType.LBRACE, value: '{', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '}') { tokens.push({ type: ChartTokenType.RBRACE, value: '}', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ':') { tokens.push({ type: ChartTokenType.COLON, value: ':', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '=') { tokens.push({ type: ChartTokenType.EQUALS, value: '=', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ',') { tokens.push({ type: ChartTokenType.COMMA, value: ',', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '-' && (i + 1 >= line.length || /\s/.test(line[i + 1]))) {
        tokens.push({ type: ChartTokenType.HYPHEN, value: '-', line: lineNum, column: col });
        i++; col++; continue;
      }

      // Numbers (supports scientific notation e.g. 1.5e3, 1e-4)
      if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.test(lineRem) && (i === 0 || /[ \t=\[:,{]/.test(line[i - 1]))) {
        const numMatch = lineRem.match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        if (numMatch) {
          const numStr = numMatch[0];
          tokens.push({ type: ChartTokenType.NUMBER, value: Number(numStr), raw: numStr, line: lineNum, column: col });
          i += numStr.length;
          col += numStr.length;
          continue;
        }
      }

      // Identifiers / Keywords / Hex Colors
      const identMatch = lineRem.match(/^#?[a-zA-Z0-9_\-.]+/);
      if (identMatch) {
        const word = identMatch[0];
        let type = ChartTokenType.IDENTIFIER;
        if (word === 'true' || word === 'false') {
          type = ChartTokenType.BOOLEAN;
          tokens.push({ type, value: word === 'true', line: lineNum, column: col });
        } else {
          tokens.push({ type, value: word, line: lineNum, column: col });
        }
        i += word.length;
        col += word.length;
        continue;
      }

      // Fallback single character
      tokens.push({ type: ChartTokenType.IDENTIFIER, value: char, line: lineNum, column: col });
      i++; col++;
    }

    tokens.push({ type: ChartTokenType.NEWLINE, line: lineNum, column: col });
  }

  tokens.push({ type: ChartTokenType.EOF, line: lines.length, column: 1 });
  return tokens;
}
