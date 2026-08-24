/**
 * Zolto Vector Graphics Tokenizer — Phase 7
 *
 * Scans declarative vector directive text into strongly typed tokens.
 */

export const VectorTokenType = {
  OPEN_VECTOR: 'OPEN_VECTOR',
  CLOSE_VECTOR: 'CLOSE_VECTOR',
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  EQUALS: 'EQUALS',
  COLON: 'COLON',
  NEWLINE: 'NEWLINE',
  TEXT_CONTENT: 'TEXT_CONTENT',
  EOF: 'EOF',
};

export function tokenizeVector(sourceText) {
  const tokens = [];
  const lines = sourceText.split(/\r?\n/);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    const line = lines[lineIdx];
    let i = 0;
    let col = 1;

    // Check line comment
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      tokens.push({ type: VectorTokenType.NEWLINE, line: lineNum, column: 1 });
      continue;
    }

    while (i < line.length) {
      const char = line[i];

      // Whitespace
      if (char === ' ' || char === '\t') {
        i++; col++;
        continue;
      }

      const lineRem = line.slice(i);

      // Block open @vector
      if (/^@vector\b/i.test(lineRem)) {
        tokens.push({ type: VectorTokenType.OPEN_VECTOR, value: '@vector', line: lineNum, column: col });
        i += 7; col += 7;
        continue;
      }

      // Block close @/vector
      if (/^@\/vector\b/i.test(lineRem)) {
        tokens.push({ type: VectorTokenType.CLOSE_VECTOR, value: '@/vector', line: lineNum, column: col });
        i += 8; col += 8;
        continue;
      }

      // Quoted Strings
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
        tokens.push({ type: VectorTokenType.STRING, value: strVal, line: lineNum, column: startCol });
        continue;
      }

      // Punctuation
      if (char === '=') { tokens.push({ type: VectorTokenType.EQUALS, value: '=', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ':') { tokens.push({ type: VectorTokenType.COLON, value: ':', line: lineNum, column: col }); i++; col++; continue; }

      // Numbers (supports decimals, leading-dot decimals, scientific notation, negative numbers)
      if (/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.test(lineRem) && (i === 0 || /[ \t=\[:,{]/.test(line[i - 1]))) {
        const numMatch = lineRem.match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
        if (numMatch) {
          const numStr = numMatch[0];
          tokens.push({ type: VectorTokenType.NUMBER, value: Number(numStr), raw: numStr, line: lineNum, column: col });
          i += numStr.length;
          col += numStr.length;
          continue;
        }
      }

      // Identifiers / Keywords / Colors / References
      const wordMatch = lineRem.match(/^#?[@a-zA-Z0-9_\-\.\/:]+/);
      if (wordMatch) {
        const word = wordMatch[0];
        let type = VectorTokenType.IDENTIFIER;
        if (word === 'true' || word === 'false') {
          type = VectorTokenType.BOOLEAN;
          tokens.push({ type, value: word === 'true', line: lineNum, column: col });
        } else {
          tokens.push({ type: VectorTokenType.IDENTIFIER, value: word, raw: word, line: lineNum, column: col });
        }
        i += word.length;
        col += word.length;
        continue;
      }

      // Advance single fallback character
      tokens.push({ type: VectorTokenType.IDENTIFIER, value: char, raw: char, line: lineNum, column: col });
      i++; col++;
    }

    tokens.push({ type: VectorTokenType.NEWLINE, line: lineNum, column: col });
  }

  tokens.push({ type: VectorTokenType.EOF, line: lines.length + 1, column: 1 });
  return tokens;
}
