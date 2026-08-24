/**
 * Zolto Diagram Tokenizer — Phase 5
 *
 * Tokenizes native Zolto `@diagram` domain language into token streams.
 */

export const TokenType = Object.freeze({
  HEADER: 'HEADER',           // @diagram type ...
  CLOSE_DIAGRAM: 'CLOSE_DIAGRAM', // @/diagram
  GROUP_OPEN: 'GROUP_OPEN',   // group id [attrs]
  GROUP_CLOSE: 'GROUP_CLOSE', // @/group
  CLUSTER_OPEN: 'CLUSTER_OPEN', // cluster id [attrs]
  CLUSTER_CLOSE: 'CLUSTER_CLOSE', // @/cluster
  NODE_KW: 'NODE_KW',         // node
  EDGE_KW: 'EDGE_KW',         // edge
  REF_KW: 'REF_KW',           // ref
  AS_KW: 'AS_KW',             // as
  ACTOR_KW: 'ACTOR_KW',       // actor
  ENTITY_KW: 'ENTITY_KW',     // entity
  CLASS_KW: 'CLASS_KW',       // class
  OBJECT_KW: 'OBJECT_KW',     // object
  PACKAGE_KW: 'PACKAGE_KW',   // package
  COMPONENT_KW: 'COMPONENT_KW', // component
  ARROW: 'ARROW',             // ->, -->, ||--o{, etc.
  IDENTIFIER: 'IDENTIFIER',   // node or edge id or name
  STRING: 'STRING',           // "quoted string"
  NUMBER: 'NUMBER',           // 123, 45.6
  BOOLEAN: 'BOOLEAN',         // true, false
  COLON: 'COLON',             // :
  EQUALS: 'EQUALS',           // =
  COMMA: 'COMMA',             // ,
  LBRACKET: 'LBRACKET',       // [
  RBRACKET: 'RBRACKET',       // ]
  LBRACE: 'LBRACE',           // {
  RBRACE: 'RBRACE',           // }
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
});

/**
 * Tokenize diagram content text.
 */
export function tokenizeDiagram(sourceStr) {
  const lines = sourceStr.split(/\r?\n/);
  const tokens = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const lineNum = lineIdx + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith('//') || line.startsWith('#')) {
      continue;
    }

    if (/^@\/diagram\s*$/.test(line)) {
      tokens.push({ type: TokenType.CLOSE_DIAGRAM, line: lineNum, column: 1, raw: line });
      continue;
    }

    if (/^@\/group\s*$/.test(line)) {
      tokens.push({ type: TokenType.GROUP_CLOSE, line: lineNum, column: 1, raw: line });
      continue;
    }

    if (/^@\/cluster\s*$/.test(line)) {
      tokens.push({ type: TokenType.CLUSTER_CLOSE, line: lineNum, column: 1, raw: line });
      continue;
    }

    // Process line tokens
    let col = 1;
    let i = 0;
    while (i < line.length) {
      // Skip whitespace
      while (i < line.length && /[ \t]/.test(line[i])) {
        i++;
        col++;
      }
      if (i >= line.length) break;

      const char = line[i];

      // Comment on line
      if (line.slice(i, i + 2) === '//') {
        break;
      }

      // Arrow operators: ||--o{, }o--||, -->, ->, -->, ..>, ->>, -->>, etc.
      const arrowMatch = line.slice(i).match(/^(?:\|\|--o\{|\}o--\|\||\|\|--\|\||\|o--o\||o\|--\|o|-->>|->>|==>|<--|-->|<-\.|\.\.>|->|<-)/);
      if (arrowMatch) {
        const arrowStr = arrowMatch[0];
        tokens.push({ type: TokenType.ARROW, value: arrowStr, line: lineNum, column: col });
        i += arrowStr.length;
        col += arrowStr.length;
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const quote = char;
        let strVal = '';
        let startCol = col;
        i++; // skip quote
        col++;
        while (i < line.length && line[i] !== quote) {
          if (line[i] === '\\' && i + 1 < line.length) {
            strVal += line[i + 1];
            i += 2;
            col += 2;
          } else {
            strVal += line[i];
            i++;
            col++;
          }
        }
        if (i < line.length && line[i] === quote) {
          i++; // skip closing quote
          col++;
        }
        tokens.push({ type: TokenType.STRING, value: strVal, line: lineNum, column: startCol });
        continue;
      }

      // Single char punctuation
      if (char === '[') { tokens.push({ type: TokenType.LBRACKET, value: '[', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ']') { tokens.push({ type: TokenType.RBRACKET, value: ']', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '{') { tokens.push({ type: TokenType.LBRACE, value: '{', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '}') { tokens.push({ type: TokenType.RBRACE, value: '}', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ':') { tokens.push({ type: TokenType.COLON, value: ':', line: lineNum, column: col }); i++; col++; continue; }
      if (char === '=') { tokens.push({ type: TokenType.EQUALS, value: '=', line: lineNum, column: col }); i++; col++; continue; }
      if (char === ',') { tokens.push({ type: TokenType.COMMA, value: ',', line: lineNum, column: col }); i++; col++; continue; }

      // Numbers
      if (/[0-9]/.test(char) && (i === 0 || /[ \t=\[]/.test(line[i - 1]))) {
        const numMatch = line.slice(i).match(/^-?\d+(?:\.\d+)?/);
        if (numMatch) {
          const numStr = numMatch[0];
          tokens.push({ type: TokenType.NUMBER, value: Number(numStr), raw: numStr, line: lineNum, column: col });
          i += numStr.length;
          col += numStr.length;
          continue;
        }
      }

      // Identifiers / Keywords / Special tokens like [*], pay.start, #1e293b, etc.
      let identMatch = line.slice(i).match(/^\[\*\]/);
      if (identMatch) {
        tokens.push({ type: TokenType.IDENTIFIER, value: '[*]', line: lineNum, column: col });
        i += 3;
        col += 3;
        continue;
      }

      identMatch = line.slice(i).match(/^#?[a-zA-Z0-9_\-.]+/);
      if (identMatch) {
        const word = identMatch[0];
        let type = TokenType.IDENTIFIER;
        if (word === 'node') type = TokenType.NODE_KW;
        else if (word === 'edge') type = TokenType.EDGE_KW;
        else if (word === 'group') type = TokenType.GROUP_OPEN;
        else if (word === 'cluster') type = TokenType.CLUSTER_OPEN;
        else if (word === 'ref') type = TokenType.REF_KW;
        else if (word === 'as') type = TokenType.AS_KW;
        else if (word === 'actor') type = TokenType.ACTOR_KW;
        else if (word === 'entity') type = TokenType.ENTITY_KW;
        else if (word === 'class') type = TokenType.CLASS_KW;
        else if (word === 'object') type = TokenType.OBJECT_KW;
        else if (word === 'package') type = TokenType.PACKAGE_KW;
        else if (word === 'component') type = TokenType.COMPONENT_KW;
        else if (word === 'true' || word === 'false') {
          type = TokenType.BOOLEAN;
          tokens.push({ type, value: word === 'true', line: lineNum, column: col });
          i += word.length;
          col += word.length;
          continue;
        }

        tokens.push({ type, value: word, line: lineNum, column: col });
        i += word.length;
        col += word.length;
        continue;
      }

      // Fallback consume character
      tokens.push({ type: TokenType.IDENTIFIER, value: char, line: lineNum, column: col });
      i++;
      col++;
    }

    tokens.push({ type: TokenType.NEWLINE, line: lineNum, column: col });
  }

  tokens.push({ type: TokenType.EOF, line: lines.length, column: 1 });
  return tokens;
}
