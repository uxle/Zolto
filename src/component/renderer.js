/**
 * Zolto Component & Template Renderer Engine — Phase 9
 *
 * Evaluates component instantiations, template inheritance, macro expansions,
 * slot injection, conditionals, and loops into rendered HTML string output.
 */

import { validateAndBindProps, interpolateText, evaluateContextPath } from './props.js';
import { resolveSlots } from './slots.js';
import { expandMacro } from './macros.js';
import { resolveTemplateInheritance } from './templates.js';
import { ComponentDiagnostics } from './diagnostics.js';

export const MAX_COMPONENT_DEPTH = 20;

export function renderComponentNode(node, context = {}, registry = null, renderBlockFn = null, depth = 0) {
  if (!node || typeof node !== 'object') return '';

  const diagnostics = new ComponentDiagnostics();

  if (depth > MAX_COMPONENT_DEPTH) {
    return `<div class="zl-component-error">Max component depth (${MAX_COMPONENT_DEPTH}) exceeded</div>`;
  }

  switch (node.type) {
    case 'component_use': {
      const compName = node.name;
      const compDef = registry ? registry.getComponent(compName) : null;

      if (!compDef) {
        return `<div class="zl-component-error">Unknown component: ${compName}</div>`;
      }

      // Bind props
      const boundProps = validateAndBindProps(compDef.props || [], node.props || {}, context, diagnostics);

      // Resolve slots
      const resolvedSlots = resolveSlots(compDef.slots || [], node.slots || {}, node.children || []);

      // Format slot HTML contents
      const slotContext = { ...boundProps };
      for (const [sName, sBody] of Object.entries(resolvedSlots)) {
        if (Array.isArray(sBody)) {
          slotContext[`slot:${sName}`] = sBody.map(b => typeof b === 'string' ? interpolateText(b, slotContext) : (renderBlockFn ? renderBlockFn(b) : '')).join('\n');
        } else {
          slotContext[`slot:${sName}`] = String(sBody || '');
        }
      }

      // Check if built-in string/function renderer
      if (compDef.body && compDef.body.length === 1 && typeof compDef.body[0] === 'function') {
        const rawHtml = compDef.body[0](slotContext);
        return interpolateText(rawHtml, slotContext, false);
      }

      // Expand body lines/nodes
      const bodyHtml = (compDef.body || []).map(bItem => {
        if (typeof bItem === 'string') {
          return interpolateText(bItem, slotContext);
        } else if (bItem && typeof bItem === 'object') {
          return renderComponentNode(bItem, slotContext, registry, renderBlockFn, depth + 1);
        }
        return '';
      }).join('\n');

      return bodyHtml;
    }

    case 'template_use': {
      const tplName = node.name;
      let tplDef = registry ? registry.getTemplate(tplName) : null;
      if (!tplDef) {
        return `<div class="zl-template-error">Unknown template: ${tplName}</div>`;
      }

      if (tplDef.extendsName) {
        tplDef = resolveTemplateInheritance(tplDef, registry);
      }

      const boundProps = validateAndBindProps(tplDef.props || [], node.props || {}, context, diagnostics);
      const resolvedSlots = resolveSlots(tplDef.slots || [], node.slots || {}, node.children || []);

      const tplContext = { ...boundProps };
      for (const [sName, sBody] of Object.entries(resolvedSlots)) {
        tplContext[`slot:${sName}`] = Array.isArray(sBody)
          ? sBody.map(b => typeof b === 'string' ? interpolateText(b, tplContext) : (renderBlockFn ? renderBlockFn(b) : '')).join('\n')
          : String(sBody || '');
      }

      return (tplDef.body || []).map(item => {
        if (typeof item === 'string') return interpolateText(item, tplContext);
        if (item && typeof item === 'object') return renderComponentNode(item, tplContext, registry, renderBlockFn, depth + 1);
        return '';
      }).join('\n');
    }

    case 'macro_use': {
      const macroName = node.name;
      const macroDef = registry ? registry.getMacro(macroName) : null;
      if (!macroDef) {
        return `<div class="zl-macro-error">Unknown macro: ${macroName}</div>`;
      }
      return expandMacro(macroDef, node.args || [], node.body || [], depth + 1, diagnostics);
    }

    case 'conditional_block': {
      const branches = node.branches || [];
      for (const branch of branches) {
        const val = evaluateCondition(branch.condition, context);
        if (val) {
          return (branch.body || []).map(b => typeof b === 'string' ? interpolateText(b, context) : (renderBlockFn ? renderBlockFn(b) : '')).join('\n');
        }
      }
      if (node.elseBranch) {
        return (node.elseBranch || []).map(b => typeof b === 'string' ? interpolateText(b, context) : (renderBlockFn ? renderBlockFn(b) : '')).join('\n');
      }
      return '';
    }

    case 'loop_block': {
      const items = evaluateContextPath(node.iterable, context);
      const arr = Array.isArray(items) ? items : (items ? [items] : []);

      const results = [];
      arr.forEach((item, index) => {
        const itemCtx = { ...context, [node.itemVar]: item };
        if (node.indexVar) itemCtx[node.indexVar] = index;

        const loopHtml = (node.body || []).map(b => {
          if (typeof b === 'string') return interpolateText(b, itemCtx);
          if (b && typeof b === 'object') return renderComponentNode(b, itemCtx, registry, renderBlockFn, depth + 1);
          return '';
        }).join('\n');

        results.push(loopHtml);
      });

      return results.join('\n');
    }

    case 'slot_outlet': {
      const slotHtml = context[`slot:${node.name}`];
      if (slotHtml) return slotHtml;
      // render fallback if missing
      return (node.body || []).map(b => {
         if (typeof b === 'string') return interpolateText(b, context);
         if (b && typeof b === 'object') return renderComponentNode(b, context, registry, renderBlockFn, depth + 1);
         return '';
      }).join('\n');
    }

    default:
      return renderBlockFn ? renderBlockFn(node) : '';
  }
}

function evaluateCondition(expr, context = {}) {
  if (!expr || typeof expr !== 'string') return false;
  let str = expr.trim();

  // Negation !
  let isNegated = false;
  if (str.startsWith('!')) {
    isNegated = true;
    str = str.slice(1).trim();
  }

  // Equality comparison >=, <=, ==, !=
  if (str.includes('>=')) {
    const [left, right] = str.split('>=').map(s => s.trim());
    const lVal = Number(evaluateContextPath(left, context));
    const rVal = Number(right);
    const res = lVal >= rVal;
    return isNegated ? !res : res;
  }

  if (str.includes('<=')) {
    const [left, right] = str.split('<=').map(s => s.trim());
    const lVal = Number(evaluateContextPath(left, context));
    const rVal = Number(right);
    const res = lVal <= rVal;
    return isNegated ? !res : res;
  }

  if (str.includes('==')) {
    const [left, right] = str.split('==').map(s => s.trim());
    const lVal = String(evaluateContextPath(left, context));
    const rVal = right.replace(/^["']|["']$/g, '');
    const res = lVal === rVal;
    return isNegated ? !res : res;
  }

  const val = evaluateContextPath(str, context);
  const boolVal = Boolean(val && val !== 'false' && val !== '0');
  return isNegated ? !boolVal : boolVal;
}
