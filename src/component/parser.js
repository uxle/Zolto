/**
 * Zolto Component Parser — Phase 9
 *
 * Parses component, template, macro definitions, slots, fills, conditionals,
 * loops, and invocation expressions into stable monomorphic AST nodes.
 */

import {
  createComponentDefNode, createComponentUseNode, createTemplateDefNode,
  createTemplateUseNode, createSlotDefNode, createSlotOutletNode,
  createMacroDefNode, createMacroUseNode, createConditionalBlockNode,
  createLoopBlockNode
} from './ast.js';
import { parsePropDeclaration, parseLiteralValue } from './props.js';
import { tokenizeComponentSource, ComponentTokenType } from './tokenizer.js';

export function parseComponentSource(sourceText, options = {}) {
  const tokens = tokenizeComponentSource(sourceText);
  let pos = 0;

  function peek() {
    return tokens[pos] || { type: ComponentTokenType.EOF };
  }

  function advance() {
    return tokens[pos++];
  }

  function match(type, val = null) {
    const tok = peek();
    if (tok.type === type && (val === null || tok.value === val || tok.value.toLowerCase() === val)) {
      return advance();
    }
    return null;
  }

  function readLineText() {
    let lineStr = '';
    while (pos < tokens.length) {
      const t = peek();
      if (t.type === ComponentTokenType.NEWLINE || t.type === ComponentTokenType.EOF) {
        advance();
        break;
      }
      lineStr += (lineStr ? ' ' : '') + t.value;
      advance();
    }
    return lineStr;
  }

  const nodes = [];

  while (pos < tokens.length && peek().type !== ComponentTokenType.EOF) {
    const tok = peek();

    if (tok.type === ComponentTokenType.NEWLINE) {
      advance();
      continue;
    }

    // Component Definition: component Card(...) ... end  OR  @component Card ... @/component
    if ((tok.type === ComponentTokenType.KEYWORD && tok.value.toLowerCase() === 'component') || tok.value === 'component') {
      advance(); // consume component
      const nameTok = advance();
      const compName = nameTok ? nameTok.value : 'AnonymousComponent';

      // Parse props list if present in parens
      const props = [];
      if (match(ComponentTokenType.OPEN_PAREN)) {
        let propStr = '';
        while (pos < tokens.length && peek().type !== ComponentTokenType.CLOSE_PAREN && peek().type !== ComponentTokenType.EOF) {
          const t = advance();
          propStr += t.value + (t.type === ComponentTokenType.EQUALS ? '=' : ' ');
        }
        match(ComponentTokenType.CLOSE_PAREN);

        const decls = propStr.split(',').map(s => s.trim()).filter(Boolean);
        for (const d of decls) {
          const parsed = parsePropDeclaration(d);
          if (parsed) props.push(parsed);
        }
      }

      // Parse body until end or @/component
      const bodyLines = [];
      const slots = [];
      while (pos < tokens.length) {
        const t = peek();
        if (t.type === ComponentTokenType.NEWLINE) {
          advance();
          continue;
        }
        if (t.type === ComponentTokenType.KEYWORD && (t.value.toLowerCase() === 'end' || t.value === '/component')) {
          advance();
          break;
        }

        // Check for slot definitions
        if (t.type === ComponentTokenType.KEYWORD && (t.value.toLowerCase() === 'slot' || t.value === 'slot')) {
          advance();
          let slotName = 'default';
          if (peek().type === ComponentTokenType.IDENTIFIER) {
            slotName = advance().value;
          }

          const fallbackLines = [];
          while (pos < tokens.length) {
            const st = peek();
            if (st.type === ComponentTokenType.NEWLINE) {
              advance();
              continue;
            }
            if (st.type === ComponentTokenType.KEYWORD && st.value === '/slot') {
              advance();
              break;
            }
            if (st.type === ComponentTokenType.KEYWORD && st.value.toLowerCase() === 'end') {
              // A bare `slot` marker with no fallback content has nothing
              // of its own to close — this `end` belongs to whatever
              // encloses it (the component definition, a parent slot,
              // etc.), so leave it unconsumed for that outer loop to see.
              if (fallbackLines.length === 0) break;
              advance();
              break;
            }
            fallbackLines.push(readLineText());
          }
          slots.push(createSlotDefNode(slotName, fallbackLines));
          bodyLines.push(createSlotOutletNode(slotName, fallbackLines));
          continue;
        }

        bodyLines.push(readLineText());
      }

      nodes.push(createComponentDefNode(compName, props, slots, bodyLines));
      continue;
    }

    // Template Definition: template Report(...) ... end
    if (tok.type === ComponentTokenType.KEYWORD && tok.value.toLowerCase() === 'template') {
      advance();
      const nameTok = advance();
      const tplName = nameTok ? nameTok.value : 'AnonymousTemplate';

      let extendsName = null;
      if (match(ComponentTokenType.KEYWORD, 'extends')) {
        const extTok = advance();
        if (extTok) extendsName = extTok.value;
      }

      const props = [];
      if (match(ComponentTokenType.OPEN_PAREN)) {
        let propStr = '';
        while (pos < tokens.length && peek().type !== ComponentTokenType.CLOSE_PAREN && peek().type !== ComponentTokenType.EOF) {
          const t = advance();
          propStr += t.value + ' ';
        }
        match(ComponentTokenType.CLOSE_PAREN);
        for (const d of propStr.split(',').map(s => s.trim()).filter(Boolean)) {
          const p = parsePropDeclaration(d);
          if (p) props.push(p);
        }
      }

      const bodyLines = [];
      const slots = [];
      while (pos < tokens.length) {
        const t = peek();
        if (t.type === ComponentTokenType.NEWLINE) {
          advance();
          continue;
        }
        if (t.type === ComponentTokenType.KEYWORD && (t.value.toLowerCase() === 'end' || t.value === '/template')) {
          advance();
          break;
        }
        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'slot') {
          advance();
          const slotName = peek().type === ComponentTokenType.IDENTIFIER ? advance().value : 'default';
          const fallback = [];
          while (pos < tokens.length) {
            const st = peek();
            if (st.type === ComponentTokenType.NEWLINE) {
              advance();
              continue;
            }
            if (st.type === ComponentTokenType.KEYWORD && st.value.toLowerCase() === 'end') {
              // A bare `slot` marker with no fallback content has nothing
              // of its own to close — this `end` belongs to the enclosing
              // template definition, so leave it unconsumed.
              if (fallback.length === 0) break;
              advance();
              break;
            }
            fallback.push(readLineText());
          }
          slots.push(createSlotDefNode(slotName, fallback));
          bodyLines.push(createSlotOutletNode(slotName, fallback));
          continue;
        }
        bodyLines.push(readLineText());
      }

      nodes.push(createTemplateDefNode(tplName, extendsName, props, slots, bodyLines));
      continue;
    }

    // Macro Definition: macro note(...) ... end
    if (tok.type === ComponentTokenType.KEYWORD && tok.value.toLowerCase() === 'macro') {
      advance();
      const nameTok = advance();
      const macroName = nameTok ? nameTok.value : 'anonymousMacro';

      const params = [];
      if (match(ComponentTokenType.OPEN_PAREN)) {
        while (pos < tokens.length && peek().type !== ComponentTokenType.CLOSE_PAREN && peek().type !== ComponentTokenType.EOF) {
          const t = advance();
          if (t.type === ComponentTokenType.IDENTIFIER) params.push(t.value);
        }
        match(ComponentTokenType.CLOSE_PAREN);
      }

      const bodyLines = [];
      while (pos < tokens.length) {
        const t = peek();
        if (t.type === ComponentTokenType.NEWLINE) {
          advance();
          continue;
        }
        if (t.type === ComponentTokenType.KEYWORD && (t.value.toLowerCase() === 'end' || t.value === '/macro')) {
          advance();
          break;
        }
        bodyLines.push(readLineText());
      }

      nodes.push(createMacroDefNode(macroName, params, false, bodyLines));
      continue;
    }

    // Conditional Block: if condition ... elseif ... else ... end
    if (tok.type === ComponentTokenType.KEYWORD && tok.value.toLowerCase() === 'if') {
      advance();
      let condExpr = '';
      while (pos < tokens.length && peek().type !== ComponentTokenType.NEWLINE && peek().type !== ComponentTokenType.EOF) {
        condExpr += advance().value + ' ';
      }

      const branches = [];
      let currentBranchBody = [];
      let currentCond = condExpr.trim();
      let elseBody = null;

      while (pos < tokens.length) {
        const t = peek();
        if (t.type === ComponentTokenType.NEWLINE) {
          advance();
          continue;
        }
        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'end') {
          advance();
          if (elseBody !== null) {
            // done
          } else {
            branches.push({ condition: currentCond, body: currentBranchBody });
          }
          break;
        }

        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'elseif') {
          advance();
          branches.push({ condition: currentCond, body: currentBranchBody });
          currentBranchBody = [];
          let nextCond = '';
          while (pos < tokens.length && peek().type !== ComponentTokenType.NEWLINE) {
            nextCond += advance().value + ' ';
          }
          currentCond = nextCond.trim();
          continue;
        }

        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'else') {
          advance();
          branches.push({ condition: currentCond, body: currentBranchBody });
          elseBody = [];
          while (pos < tokens.length) {
            const st = peek();
            if (st.type === ComponentTokenType.NEWLINE) {
              advance();
              continue;
            }
            if (st.type === ComponentTokenType.KEYWORD && st.value.toLowerCase() === 'end') {
              advance();
              break;
            }
            elseBody.push(readLineText());
          }
          break;
        }

        currentBranchBody.push(readLineText());
      }

      nodes.push(createConditionalBlockNode(branches, elseBody));
      continue;
    }

    // Loop Block: each items as item ... end
    if (tok.type === ComponentTokenType.KEYWORD && tok.value.toLowerCase() === 'each') {
      advance();
      let loopHeader = '';
      while (pos < tokens.length && peek().type !== ComponentTokenType.NEWLINE && peek().type !== ComponentTokenType.EOF) {
        loopHeader += advance().value + ' ';
      }

      // Format: items as item,index  OR  items as item key product.id
      let iterable = 'items';
      let itemVar = 'item';
      let indexVar = null;
      let keyExpr = null;

      const headerStr = loopHeader.trim();
      const asIdx = headerStr.indexOf(' as ');
      if (asIdx !== -1) {
        iterable = headerStr.slice(0, asIdx).trim();
        let rest = headerStr.slice(asIdx + 4).trim();

        const keyIdx = rest.indexOf('key ');
        if (keyIdx !== -1) {
          keyExpr = rest.slice(keyIdx + 4).trim();
          rest = rest.slice(0, keyIdx).trim();
        }

        const commaIdx = rest.indexOf(',');
        if (commaIdx !== -1) {
          itemVar = rest.slice(0, commaIdx).trim();
          indexVar = rest.slice(commaIdx + 1).trim();
        } else {
          itemVar = rest;
        }
      }

      const bodyLines = [];
      while (pos < tokens.length) {
        const t = peek();
        if (t.type === ComponentTokenType.NEWLINE) {
          advance();
          continue;
        }
        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'end') {
          advance();
          break;
        }
        bodyLines.push(readLineText());
      }

      nodes.push(createLoopBlockNode(iterable, itemVar, indexVar, keyExpr, bodyLines));
      continue;
    }

    // Component Call: Card(title="Hello") ... fill slot ... end  OR  <Card title="Hello">
    if (tok.type === ComponentTokenType.IDENTIFIER && /^[A-Z]/.test(tok.value)) {
      const compName = advance().value;
      const props = {};
      const slots = {};
      const children = [];

      if (match(ComponentTokenType.OPEN_PAREN)) {
        while (pos < tokens.length && peek().type !== ComponentTokenType.CLOSE_PAREN && peek().type !== ComponentTokenType.EOF) {
          const keyTok = advance();
          if (keyTok.type === ComponentTokenType.IDENTIFIER || keyTok.type === ComponentTokenType.KEYWORD) {
            if (match(ComponentTokenType.EQUALS)) {
              const valTok = advance();
              props[keyTok.value] = parseLiteralValue(valTok ? valTok.value : 'true');
            } else {
              props[keyTok.value] = true;
            }
          }
        }
        match(ComponentTokenType.CLOSE_PAREN);
      }

      // Check for children / fill blocks
      while (pos < tokens.length) {
        const t = peek();
        if (t.type === ComponentTokenType.NEWLINE) {
          advance();
          continue;
        }
        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'end') {
          advance();
          break;
        }

        if (t.type === ComponentTokenType.KEYWORD && t.value.toLowerCase() === 'fill') {
          advance();
          const slotName = peek().type === ComponentTokenType.IDENTIFIER ? advance().value : 'default';
          const fillBody = [];
          while (pos < tokens.length) {
            const st = peek();
            if (st.type === ComponentTokenType.NEWLINE) {
              advance();
              continue;
            }
            if (st.type === ComponentTokenType.KEYWORD && st.value.toLowerCase() === 'end') {
              advance();
              break;
            }
            fillBody.push(readLineText());
          }
          slots[slotName] = fillBody;
          continue;
        }

        children.push(readLineText());
      }

      nodes.push(createComponentUseNode(compName, props, slots, children));
      continue;
    }

    advance();
  }

  return nodes;
}
