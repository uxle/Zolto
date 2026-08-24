/**
 * Zolto Layout Engine — Parser (Phase 8)
 *
 * Recursive descent parser for spatial layout directives and nested structures.
 */

import { parseLayoutAttrStr } from './tokenizer.js';
import {
  createLayoutNode, createHeaderNode, createMainNode, createFooterNode,
  createSidebarNode, createNavigationNode, createSectionNode, createContainerNode,
  createSpacerNode, createBoxNode, createGridNode, createCellNode,
  createFlexNode, createFlexItemNode, createStackNode, createCanvasNode,
  createCanvasLayerNode, createCanvasObjectNode, createPagesNode, createPageNode,
  createPresentationNode, createSlideNode,
} from './ast.js';
import { extractChildren } from '../directive-lexer.js';
import { parseTokens } from '../parser.js';
import { tokenize } from '../lexer.js';

/**
 * Parse a raw layout block source string into a Spatial AST node.
 *
 * @param {string} srcStr   Raw body or full block string
 * @param {string} [headerStr] Opening directive line e.g. "@layout width=1200" or "@grid columns=3"
 * @returns {{ ast: object, diagnostics: object }}
 */
export function parseLayout(srcStr, headerStr = '') {
  const headerMatch = /^\s*@([a-zA-Z0-9_-]+)(?:\s+([\s\S]*))?$/.exec(headerStr.trim());
  const directiveName = headerMatch ? headerMatch[1].toLowerCase() : 'layout';
  const attrStr = headerMatch ? (headerMatch[2] ?? '') : headerStr;

  const attrs = parseLayoutAttrStr(attrStr);
  const ast = parseLayoutBlock(directiveName, attrs, srcStr);

  return { ast, diagnostics: { errors: [], warnings: [] } };
}

/**
 * Parse a layout directive block by name.
 */
export function parseLayoutBlock(name, attrs, bodyStr) {
  switch (name) {
    case 'layout': {
      const children = parseNestedLayoutContent(bodyStr);
      return createLayoutNode(attrs, children);
    }
    case 'grid': {
      const cellBlocks = extractChildren(bodyStr, 'cell');
      const children = cellBlocks.length > 0
        ? cellBlocks.map(c => createCellNode(parseLayoutAttrStr(c.attrStr), parseNestedLayoutContent(c.body)))
        : parseNestedLayoutContent(bodyStr);
      return createGridNode(attrs, children);
    }
    case 'cell': {
      const children = parseNestedLayoutContent(bodyStr);
      return createCellNode(attrs, children);
    }
    case 'flex': {
      const itemBlocks = extractChildren(bodyStr, 'item');
      const children = itemBlocks.length > 0
        ? itemBlocks.map(it => createFlexItemNode(parseLayoutAttrStr(it.attrStr), parseNestedLayoutContent(it.body)))
        : parseNestedLayoutContent(bodyStr);
      return createFlexNode(attrs, children);
    }
    case 'item': {
      const children = parseNestedLayoutContent(bodyStr);
      return createFlexItemNode(attrs, children);
    }
    case 'stack': {
      const itemBlocks = extractChildren(bodyStr, 'item');
      const children = itemBlocks.length > 0
        ? itemBlocks.map(it => createFlexItemNode(parseLayoutAttrStr(it.attrStr), parseNestedLayoutContent(it.body)))
        : parseNestedLayoutContent(bodyStr);
      return createStackNode(attrs, children);
    }
    case 'canvas': {
      const layerBlocks = extractChildren(bodyStr, 'layer');
      const children = layerBlocks.length > 0
        ? layerBlocks.map(l => createCanvasLayerNode(parseLayoutAttrStr(l.attrStr), parseCanvasLayerContent(l.body)))
        : parseCanvasLayerContent(bodyStr);
      return createCanvasNode(attrs, children);
    }
    case 'layer': {
      const children = parseCanvasLayerContent(bodyStr);
      return createCanvasLayerNode(attrs, children);
    }
    case 'pages': {
      const pageBlocks = extractChildren(bodyStr, 'page');
      const children = pageBlocks.length > 0
        ? pageBlocks.map(p => createPageNode(parseLayoutAttrStr(p.attrStr), parseNestedLayoutContent(p.body)))
        : parseNestedLayoutContent(bodyStr);
      return createPagesNode(attrs, children);
    }
    case 'page': {
      const children = parseNestedLayoutContent(bodyStr);
      return createPageNode(attrs, children);
    }
    case 'presentation': {
      const slideBlocks = extractChildren(bodyStr, 'slide');
      const children = slideBlocks.length > 0
        ? slideBlocks.map(s => createSlideNode(parseLayoutAttrStr(s.attrStr), parseNestedLayoutContent(s.body)))
        : parseNestedLayoutContent(bodyStr);
      return createPresentationNode(attrs, children);
    }
    case 'slide': {
      const children = parseNestedLayoutContent(bodyStr);
      return createSlideNode(attrs, children);
    }
    case 'header': {
      return createHeaderNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'main': {
      return createMainNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'footer': {
      return createFooterNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'sidebar': {
      return createSidebarNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'navigation': {
      return createNavigationNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'section': {
      return createSectionNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'container': {
      return createContainerNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    case 'spacer': {
      return createSpacerNode(attrs);
    }
    case 'box': {
      return createBoxNode(attrs, parseNestedLayoutContent(bodyStr));
    }
    default: {
      return createLayoutNode(attrs, parseNestedLayoutContent(bodyStr));
    }
  }
}

function dedentLines(lines) {
  let minIndent = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^[ \t]*/);
    const indent = match ? match[0].length : 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === Infinity || minIndent === 0) return lines;
  return lines.map(line => line.length >= minIndent ? line.slice(minIndent) : line);
}

/**
 * Parse nested spatial blocks or Markdown/diagram/chart/vector content.
 */
export function parseNestedLayoutContent(bodyStr) {
  if (!bodyStr || !bodyStr.trim()) return [];

  const lines = bodyStr.split('\n');
  const resultNodes = [];
  let currentTextLines = [];

  function flushText() {
    if (currentTextLines.length > 0) {
      const dedented = dedentLines(currentTextLines);
      const text = dedented.join('\n');
      if (text.trim()) {
        const { tokens } = tokenize(text);
        const docNode = parseTokens(tokens);
        if (docNode && docNode.children) {
          resultNodes.push(...docNode.children);
        }
      }
      currentTextLines = [];
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const openMatch = /^\s*@([a-zA-Z0-9_-]+)(?:\s+(.*))?$/.exec(line);

    if (openMatch && !line.trim().startsWith('@/')) {
      const tag = openMatch[1].toLowerCase();
      const attrStr = openMatch[2] ?? '';

      // Check if it's a known layout block directive
      const isLayoutTag = [
        'layout', 'header', 'main', 'footer', 'sidebar', 'navigation',
        'section', 'container', 'spacer', 'box', 'grid', 'cell',
        'flex', 'item', 'stack', 'canvas', 'layer', 'pages', 'page',
        'presentation', 'slide',
      ].includes(tag);

      if (isLayoutTag) {
        flushText();
        let attrStr = openMatch[2] ?? '';
        let qCount = (attrStr.match(/"/g) || []).length + (attrStr.match(/'/g) || []).length;
        while (qCount % 2 !== 0 && i + 1 < lines.length) {
          i++;
          attrStr += '\n' + lines[i].trim();
          qCount = (attrStr.match(/"/g) || []).length + (attrStr.match(/'/g) || []).length;
        }

        const closeTag = `@/${tag}`;
        const blockBodyLines = [];
        let depth = 1;
        i++;

        while (i < lines.length && depth > 0) {
          const stripped = lines[i].trimStart();
          if (stripped.startsWith(`@${tag}`) && (stripped[`@${tag}`.length] === undefined || /[\s/]/.test(stripped[`@${tag}`.length]))) {
            depth++;
          }
          if (stripped === closeTag || stripped.startsWith(closeTag + ' ')) {
            depth--;
            if (depth === 0) { i++; break; }
          }
          if (depth > 0) blockBodyLines.push(lines[i]);
          i++;
        }

        const childBlockNode = parseLayoutBlock(tag, parseLayoutAttrStr(attrStr), blockBodyLines.join('\n'));
        resultNodes.push(childBlockNode);
        continue;
      }
    }

    currentTextLines.push(line);
    i++;
  }

  flushText();
  return resultNodes;
}

/**
 * Parse canvas layer objects (@rect, @text, @image, @line, @shape, @box).
 */
function parseCanvasLayerContent(bodyStr) {
  if (!bodyStr || !bodyStr.trim()) return [];

  const lines = bodyStr.split('\n');
  const objects = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    const m = /^\s*@([a-zA-Z0-9_-]+)(?:\s+(.*))?$/.exec(line);
    if (m && !line.startsWith('@/')) {
      const type = m[1].toLowerCase();
      const attrStr = m[2] ?? '';
      const attrs = parseLayoutAttrStr(attrStr);

      if (['rect', 'text', 'image', 'line', 'shape', 'box'].includes(type)) {
        let contentLines = [];
        const closeTag = `@/${type}`;
        if (bodyStr.includes(closeTag)) {
          i++;
          while (i < lines.length && !lines[i].trim().startsWith(closeTag)) {
            contentLines.push(lines[i]);
            i++;
          }
          if (i < lines.length) i++; // skip closing tag
        } else {
          i++;
        }
        const childContent = contentLines.length > 0 ? parseNestedLayoutContent(contentLines.join('\n')) : [];
        objects.push(createCanvasObjectNode(type, attrs, childContent));
        continue;
      }
    }
    i++;
  }

  return objects.length > 0 ? objects : parseNestedLayoutContent(bodyStr);
}
