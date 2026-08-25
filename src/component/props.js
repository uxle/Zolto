/**
 * Zolto Component Props & Binding System — Phase 9
 *
 * Handles parsing, default evaluation, type validation, required checks,
 * and context interpolation ({name}, {item.title}) for components and templates.
 */

import { escapeHtml } from '../tokenizer.js';

export function parsePropDeclaration(declStr) {
  if (!declStr || typeof declStr !== 'string') return null;
  const str = declStr.trim();
  if (!str) return null;

  // Format: name[!][: type[=default]][=default]
  // Example: title!
  // Example: count : number=0
  // Example: tone : enum(info, warning, success, error)=info
  // Example: subtitle=""

  let namePart = str;
  let defaultVal = null;
  let hasDefault = false;

  const eqIdx = str.indexOf('=');
  if (eqIdx !== -1) {
    namePart = str.slice(0, eqIdx).trim();
    const valRaw = str.slice(eqIdx + 1).trim();
    defaultVal = parseLiteralValue(valRaw);
    hasDefault = true;
  }

  let required = false;
  let typeName = 'any';
  let enumValues = null;

  const colonIdx = namePart.indexOf(':');
  if (colonIdx !== -1) {
    const rawName = namePart.slice(0, colonIdx).trim();
    const rawType = namePart.slice(colonIdx + 1).trim();

    if (rawName.endsWith('!')) {
      required = true;
      namePart = rawName.slice(0, -1).trim();
    } else {
      namePart = rawName;
    }

    if (rawType.startsWith('enum(')) {
      typeName = 'enum';
      const parenContent = rawType.slice(5, rawType.indexOf(')')).trim();
      enumValues = parenContent.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    } else {
      typeName = rawType.toLowerCase();
    }
  } else {
    if (namePart.endsWith('!')) {
      required = true;
      namePart = namePart.slice(0, -1).trim();
    }
  }

  return {
    name: namePart,
    required,
    type: typeName,
    enumValues,
    defaultValue: hasDefault ? defaultVal : null,
    hasDefault,
  };
}

// Split a comma-separated literal-list body (the inside of `[...]` or
// `{...}`) on top-level commas only — skipping over commas that appear
// inside a quoted string. The previous plain `.split(',')` broke on any
// comma embedded in a quoted array/object value: `["a,b", "c"]` split
// into three broken fragments instead of two clean elements, and
// `{name="Smith, John"}` lost the `name` key entirely and produced two
// garbage keys from the two halves of the split string.
function splitTopLevelCommas(s) {
  const parts = [];
  let depth = 0, quote = null, current = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      current += c;
      if (c === '\\') { i++; if (i < s.length) current += s[i]; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; current += c; continue; }
    if (c === '[' || c === '{') { depth++; current += c; continue; }
    if (c === ']' || c === '}') { depth--; current += c; continue; }
    if (c === ',' && depth === 0) { parts.push(current); current = ''; continue; }
    current += c;
  }
  if (current.trim() !== '') parts.push(current);
  return parts;
}

export function parseLiteralValue(valStr) {
  if (valStr === undefined || valStr === null) return null;
  const s = String(valStr).trim();
  if (!s) return '';

  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (!isNaN(Number(s))) return Number(s);

  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const items = splitTopLevelCommas(s.slice(1, -1)).map(x => parseLiteralValue(x));
      return items.filter(x => x !== null && x !== '');
    } catch {
      return [];
    }
  }

  if (s.startsWith('{') && s.endsWith('}')) {
    try {
      const obj = {};
      const pairs = splitTopLevelCommas(s.slice(1, -1));
      for (const p of pairs) {
        const eqIdx = p.indexOf('=');
        if (eqIdx === -1) continue;
        const k = p.slice(0, eqIdx).trim();
        const v = p.slice(eqIdx + 1).trim();
        if (k) obj[k] = parseLiteralValue(v);
      }
      return obj;
    } catch {
      return {};
    }
  }

  return s;
}

export function validateAndBindProps(declaredProps = [], suppliedProps = {}, context = {}, diagnostics = null) {
  const bound = { ...context };

  for (const decl of declaredProps) {
    const key = decl.name;
    let supplied = suppliedProps[key];

    if (supplied === undefined) {
      if (decl.hasDefault) {
        supplied = decl.defaultValue;
      } else if (decl.required) {
        if (diagnostics) {
          diagnostics.error('E902', `Missing required prop "${key}"`, { name: key });
        }
        supplied = '';
      } else {
        supplied = null;
      }
    } else {
      // Evaluate if passed as string expression
      if (typeof supplied === 'string' && supplied.startsWith('{') && supplied.endsWith('}')) {
        const expr = supplied.slice(1, -1).trim();
        supplied = evaluateContextPath(expr, context);
      }
    }

    // Type validation
    if (supplied !== null && supplied !== undefined && decl.type !== 'any') {
      if (decl.type === 'string' && typeof supplied !== 'string') {
        supplied = String(supplied);
      } else if (decl.type === 'number' && typeof supplied !== 'number') {
        const num = Number(supplied);
        if (!isNaN(num)) supplied = num;
        else if (diagnostics) diagnostics.warn('E903', `Prop "${key}" expected number, got ${typeof supplied}`, { name: key });
      } else if (decl.type === 'bool' || decl.type === 'boolean') {
        supplied = Boolean(supplied);
      } else if (decl.type === 'array' && !Array.isArray(supplied)) {
        supplied = [supplied];
      } else if (decl.type === 'enum' && decl.enumValues) {
        if (!decl.enumValues.includes(String(supplied))) {
          if (diagnostics) diagnostics.warn('E903', `Prop "${key}" value "${supplied}" not in enum [${decl.enumValues.join(', ')}]`, { name: key });
        }
      }
    }

    bound[key] = supplied;
  }

  // Also retain any extra supplied props
  for (const [k, v] of Object.entries(suppliedProps)) {
    if (!(k in bound)) {
      bound[k] = v;
    }
  }

  return bound;
}

export function evaluateContextPath(path, context = {}) {
  if (!path || typeof path !== 'string') return '';
  const cleanPath = path.trim();
  if (cleanPath in context) return context[cleanPath];

  const parts = cleanPath.split('.');
  let curr = context;
  for (const part of parts) {
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') return '';
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return '';
    }
  }
  return curr ?? '';
}

export function interpolateText(text, context = {}, escapeValues = true) {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/\{\s*([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*\}/g, (match, expr) => {
    const val = evaluateContextPath(expr, context);
    if (val === null || val === undefined || val === '') return match;
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return escapeValues ? escapeHtml(str) : str;
  });
}
