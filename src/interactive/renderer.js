/**
 * Zolto Interactive HTML Renderer — Phase 10
 *
 * Renders interactive AST nodes to semantic, accessible HTML strings.
 * Progressive enhancement: all elements work without JavaScript using
 * native HTML semantics. JS hooks are provided via data-zl-* attributes.
 * No DOM access. No mutable module-level state.
 */

import { INTERACTIVE_NODE_TYPES } from './ast.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function attr(name, val) {
  if (val === null || val === undefined || val === false) return '';
  if (val === true) return ` ${name}`;
  return ` ${name}="${esc(val)}"`;
}

function uid(prefix, name) {
  return `zl-${prefix}-${esc(name || 'el').replace(/\s+/g, '-').toLowerCase()}`;
}

// ─── Main dispatch ────────────────────────────────────────────────────────────

/**
 * Render any interactive AST node to an HTML string.
 * @param {object} node
 * @param {object} [opts]
 * @returns {string}
 */
export function renderInteractiveNode(node, opts = {}) {
  if (!node || typeof node !== 'object') return '';
  switch (node.type) {
    case INTERACTIVE_NODE_TYPES.INTERACTIVE:     return renderInteractive(node, opts);
    case INTERACTIVE_NODE_TYPES.FORM:            return renderForm(node, opts);
    case INTERACTIVE_NODE_TYPES.INPUT:           return renderInput(node, opts);
    case INTERACTIVE_NODE_TYPES.TEXTAREA:        return renderTextarea(node, opts);
    case INTERACTIVE_NODE_TYPES.BUTTON:          return renderButton(node, opts);
    case INTERACTIVE_NODE_TYPES.CHECKBOX:        return renderCheckbox(node, opts);
    case INTERACTIVE_NODE_TYPES.RADIO_GROUP:     return renderRadioGroup(node, opts);
    case INTERACTIVE_NODE_TYPES.SELECT:          return renderSelect(node, opts);
    case INTERACTIVE_NODE_TYPES.SLIDER:          return renderSlider(node, opts);
    case INTERACTIVE_NODE_TYPES.TOGGLE:          return renderToggle(node, opts);
    case INTERACTIVE_NODE_TYPES.SEGMENT:         return renderSegment(node, opts);
    case INTERACTIVE_NODE_TYPES.PROGRESS:        return renderProgress(node, opts);
    case INTERACTIVE_NODE_TYPES.QUIZ:            return renderQuiz(node, opts);
    case INTERACTIVE_NODE_TYPES.MCQ:             return renderMCQ(node, opts);
    case INTERACTIVE_NODE_TYPES.MULTI_CHOICE:    return renderMCQ(node, opts);
    case INTERACTIVE_NODE_TYPES.TRUE_FALSE:      return renderTrueFalse(node, opts);
    case INTERACTIVE_NODE_TYPES.FILL_BLANK:      return renderFillBlank(node, opts);
    case INTERACTIVE_NODE_TYPES.MATCHING:        return renderMatching(node, opts);
    case INTERACTIVE_NODE_TYPES.MATRIX:          return renderMatrix(node, opts);
    case INTERACTIVE_NODE_TYPES.TIMER:           return renderTimer(node, opts);
    case INTERACTIVE_NODE_TYPES.FLASHCARD_DECK:  return renderDeck(node, opts);
    case INTERACTIVE_NODE_TYPES.POLL:            return renderPoll(node, opts);
    case INTERACTIVE_NODE_TYPES.TASK_LIST:       return renderTaskList(node, opts);
    case INTERACTIVE_NODE_TYPES.TABS_INTERACTIVE:return renderITabs(node, opts);
    case INTERACTIVE_NODE_TYPES.ACCORDION:       return renderAccordion(node, opts);
    case INTERACTIVE_NODE_TYPES.STATE_BLOCK:     return '';  // state blocks are not visible
    case INTERACTIVE_NODE_TYPES.SHARED_BLOCK:    return '';
    default: return '';
  }
}

// ─── Container ────────────────────────────────────────────────────────────────

function renderInteractive(node, opts) {
  const children = (node.children || []).map(c => renderInteractiveNode(c, opts)).filter(Boolean).join('\n');
  const id = node.id ? ` id="${esc(node.id)}"` : '';
  const cls = node.classes?.length ? ` class="zl-interactive ${node.classes.map(esc).join(' ')}"` : ' class="zl-interactive"';
  return `<div${id}${cls} data-zl-interactive>\n${children}\n</div>`;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function renderForm(node, opts) {
  const id = uid('form', node.name);
  const children = (node.children || []).map(c => renderInteractiveNode(c, opts)).filter(Boolean).join('\n');
  return `<form class="zl-form" id="${esc(id)}" name="${esc(node.name)}" novalidate data-zl-form="${esc(node.name)}">\n${children}\n</form>`;
}

// ─── Input ────────────────────────────────────────────────────────────────────

function renderInput(node, opts) {
  const id = uid('input', node.name);
  const labelEl = renderFieldLabel(id, node.label, node.required, node.ariaLabel);
  const inputAttrs = [
    `type="${esc(node.inputType || 'text')}"`,
    `id="${esc(id)}"`,
    `name="${esc(node.name)}"`,
    `class="zl-input"`,
    node.placeholder   ? `placeholder="${esc(node.placeholder)}"` : '',
    node.value !== null ? `value="${esc(node.value)}"` : '',
    node.required       ? 'required' : '',
    node.disabled       ? 'disabled' : '',
    node.min !== null   ? `min="${esc(node.min)}"` : '',
    node.max !== null   ? `max="${esc(node.max)}"` : '',
    node.step !== null  ? `step="${esc(node.step)}"` : '',
    node.minLength !== null ? `minlength="${node.minLength}"` : '',
    node.maxLength !== null ? `maxlength="${node.maxLength}"` : '',
    node.pattern        ? `pattern="${esc(node.pattern)}"` : '',
    node.label || node.ariaLabel ? `aria-label="${esc(node.ariaLabel || node.label)}"` : '',
    node.description    ? `aria-describedby="${esc(id)}-desc"` : '',
    `data-zl-field="${esc(node.name)}"`,
  ].filter(Boolean).join(' ');

  const descEl = node.description ? `<span id="${esc(id)}-desc" class="zl-help">${esc(node.description)}</span>` : '';
  const helpEl = node.help   ? `<span class="zl-help">${esc(node.help)}</span>` : '';
  const errEl  = node.error  ? `<span class="zl-error-msg" role="alert">${esc(node.error)}</span>` : '';

  return `<div class="zl-field" data-zl-field-name="${esc(node.name)}">\n  ${labelEl}\n  <input ${inputAttrs}>\n  ${descEl}${helpEl}${errEl}\n</div>`;
}

function renderFieldLabel(id, label, required, ariaLabel) {
  if (!label && !ariaLabel) return '';
  const text = label || ariaLabel || '';
  const reqCls = required ? ' zl-label-required' : '';
  return `<label for="${esc(id)}" class="zl-label${reqCls}">${esc(text)}</label>`;
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

function renderTextarea(node, opts) {
  const id = uid('textarea', node.name);
  const labelEl = renderFieldLabel(id, node.label, node.required, node.ariaLabel);
  const rowsAttr = node.rows ? ` rows="${node.rows}"` : '';
  const placeholder = node.placeholder ? ` placeholder="${esc(node.placeholder)}"` : '';
  const required    = node.required ? ' required' : '';
  const disabled    = node.disabled ? ' disabled' : '';
  const helpEl = node.help  ? `<span class="zl-help">${esc(node.help)}</span>` : '';
  const errEl  = node.error ? `<span class="zl-error-msg" role="alert">${esc(node.error)}</span>` : '';
  const content = node.value ? esc(node.value) : '';
  return `<div class="zl-field" data-zl-field-name="${esc(node.name)}">\n  ${labelEl}\n  <textarea id="${esc(id)}" name="${esc(node.name)}" class="zl-textarea"${rowsAttr}${placeholder}${required}${disabled} data-zl-field="${esc(node.name)}">${content}</textarea>\n  ${helpEl}${errEl}\n</div>`;
}

// ─── Button ───────────────────────────────────────────────────────────────────

function renderButton(node, opts) {
  const variant = node.variant || 'primary';
  const type    = node.btnType  || 'button';
  const loading = node.loading  ? ' zl-btn-loading' : '';
  const disAttr = (node.disabled || node.loading) ? ' disabled aria-disabled="true"' : '';
  const ariaLbl = node.ariaLabel ? ` aria-label="${esc(node.ariaLabel)}"` : '';
  return `<button type="${esc(type)}" class="zl-btn zl-btn-${esc(variant)}${loading}"${disAttr}${ariaLbl} data-zl-btn="${esc(node.name)}">${esc(node.label)}</button>`;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function renderCheckbox(node, opts) {
  const id = uid('check', node.name);
  const checked  = node.checked  ? ' checked' : '';
  const required = node.required ? ' required' : '';
  const disabled = node.disabled ? ' disabled' : '';
  const label    = node.label || node.name;
  const helpEl   = node.help  ? `<span class="zl-help">${esc(node.help)}</span>` : '';
  const errEl    = node.error ? `<span class="zl-error-msg" role="alert">${esc(node.error)}</span>` : '';
  return `<div class="zl-field">\n  <label class="zl-check-field" for="${esc(id)}">\n    <input type="checkbox" id="${esc(id)}" name="${esc(node.name)}"${checked}${required}${disabled} data-zl-field="${esc(node.name)}">\n    <span>${esc(label)}</span>\n  </label>\n  ${helpEl}${errEl}\n</div>`;
}

// ─── Radio group ──────────────────────────────────────────────────────────────

function renderRadioGroup(node, opts) {
  const labelEl = node.label ? `<div class="zl-radio-group-label">${esc(node.label)}</div>` : '';
  const options = (node.options || []).map((opt, i) => {
    const id = uid('radio', `${node.name}-${i}`);
    return `<label class="zl-radio-option" for="${esc(id)}">\n  <input type="radio" id="${esc(id)}" name="${esc(node.name)}" value="${esc(opt.value)}">\n  <span>${esc(opt.label)}</span>\n</label>`;
  }).join('\n');
  return `<div class="zl-field" role="radiogroup" aria-label="${esc(node.label || node.name)}">\n  ${labelEl}\n  <div class="zl-radio-group">\n${options}\n  </div>\n</div>`;
}

// ─── Select ───────────────────────────────────────────────────────────────────

function renderSelect(node, opts) {
  const id       = uid('select', node.name);
  const labelEl  = renderFieldLabel(id, node.label, node.required, node.ariaLabel);
  const multiAttr = node.multi ? ' multiple' : '';
  const searchAttr = node.searchable ? ' data-zl-searchable="true"' : '';
  const placeholder = node.placeholder ? `<option value="" disabled selected>${esc(node.placeholder)}</option>\n` : '';
  const options = (node.options || []).map(o =>
    `<option value="${esc(o.value)}">${esc(o.label)}</option>`
  ).join('\n');
  const helpEl = node.help ? `<span class="zl-help">${esc(node.help)}</span>` : '';
  return `<div class="zl-field">\n  ${labelEl}\n  <select id="${esc(id)}" name="${esc(node.name)}" class="zl-select"${multiAttr}${searchAttr} data-zl-field="${esc(node.name)}">\n  ${placeholder}${options}\n  </select>\n  ${helpEl}\n</div>`;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function renderSlider(node, opts) {
  const id    = uid('slider', node.name);
  const label = node.label ? `<label for="${esc(id)}" class="zl-label">${esc(node.label)}</label>` : '';
  const val   = node.value !== null ? node.value : node.min;
  const valueDisplay = node.showValue !== false
    ? `<span class="zl-slider-value" data-zl-value="${esc(id)}">${val}</span>` : '';
  return `<div class="zl-slider-field">\n  ${label}\n  <div class="zl-slider-row">\n    <input type="range" id="${esc(id)}" name="${esc(node.name)}" class="zl-slider" min="${node.min}" max="${node.max}" step="${node.step}" value="${val}" aria-valuemin="${node.min}" aria-valuemax="${node.max}" aria-valuenow="${val}" data-zl-slider="${esc(node.name)}">\n    ${valueDisplay}\n  </div>\n</div>`;
}

// ─── Toggle / Switch ──────────────────────────────────────────────────────────

function renderToggle(node, opts) {
  const id    = uid('toggle', node.name);
  const label = node.label || node.name;
  const on    = node.checked ? ' on' : '';
  return `<div class="zl-toggle-field" role="switch" aria-checked="${!!node.checked}" aria-label="${esc(node.ariaLabel || label)}" tabindex="0" data-zl-toggle="${esc(node.name)}">\n  <div class="zl-toggle-track${on}" id="${esc(id)}">\n    <div class="zl-toggle-thumb"></div>\n  </div>\n  <span>${esc(label)}</span>\n</div>`;
}

// ─── Segment ──────────────────────────────────────────────────────────────────

function renderSegment(node, opts) {
  const items = (node.items || []).map((item, i) => {
    const active = node.value === item.value ? ' active' : '';
    return `<button type="button" class="zl-segment-item${active}" role="radio" aria-checked="${node.value === item.value}" data-zl-segment-item="${esc(item.value)}" tabindex="${active ? 0 : -1}">${esc(item.label)}</button>`;
  }).join('\n');
  const label = node.label ? `<div class="zl-label">${esc(node.label)}</div>` : '';
  return `<div class="zl-field">\n  ${label}\n  <div class="zl-segment" role="radiogroup" aria-label="${esc(node.label || node.name)}" data-zl-segment="${esc(node.name)}">\n${items}\n  </div>\n</div>`;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

function renderProgress(node, opts) {
  const pct = Math.min(100, Math.max(0, node.value || 0));
  const max  = node.max || 100;
  const label = node.label ? `<div class="zl-progress-label">${esc(node.label)}</div>` : '';
  const pctLabel = node.showPct !== false ? `<div class="zl-progress-label">${pct}%</div>` : '';
  return `<div class="zl-progress-block">\n  ${label}\n  <div class="zl-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="${max}">\n    <div class="zl-progress-fill" style="width:${pct}%"></div>\n  </div>\n  ${pctLabel}\n</div>`;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function renderQuiz(node, opts) {
  const id    = uid('quiz', node.title);
  const title = node.title ? `<h3 class="zl-quiz-title">${esc(node.title)}</h3>` : '';
  const timer = node.timed ? `<div class="zl-timer" data-zl-timer="${node.timed}" aria-live="polite">⏱ ${formatDuration(node.timed)}</div>` : '';
  const questions = (node.questions || []).map(q => renderInteractiveNode(q, opts)).filter(Boolean).join('\n');
  const submitBtn  = `<button type="submit" class="zl-btn zl-btn-primary" data-zl-quiz-submit>Check Answers</button>`;
  const scoreDiv   = `<div class="zl-quiz-score" role="status" aria-live="polite" data-zl-quiz-score></div>`;
  return `<form class="zl-quiz" id="${esc(id)}" data-zl-quiz="${esc(node.title)}" novalidate>\n  ${title}\n  ${timer}\n  ${questions}\n  <div style="margin-top:1rem">${submitBtn}</div>\n  ${scoreDiv}\n</form>`;
}

function renderMCQ(node, opts) {
  const multi = node.multi || node.type === 'multi_choice';
  const inputType = multi ? 'checkbox' : 'radio';
  const groupName = uid('mcq', node.question);
  const options = (node.options || []).map((opt, i) => {
    const id = `${groupName}-opt-${i}`;
    return `<label class="zl-option" for="${esc(id)}">\n  <input type="${inputType}" id="${esc(id)}" name="${esc(groupName)}" value="${i}" data-zl-correct="${opt.correct}">\n  <span>${esc(opt.text)}</span>\n</label>`;
  }).join('\n');
  const hint    = node.hint    ? `<div class="zl-quiz-hint" aria-label="Hint"    role="note">💡 ${esc(node.hint)}</div>` : '';
  const explain = node.explain ? `<div class="zl-quiz-explain" aria-label="Explanation" role="note">✅ ${esc(node.explain)}</div>` : '';
  return `<div class="zl-question" role="group" aria-labelledby="${esc(groupName)}-lbl" data-zl-question="${inputType}">\n  <div class="zl-question-text" id="${esc(groupName)}-lbl">${esc(node.question)}</div>\n  <div class="zl-options">${options}</div>\n  ${hint}${explain}\n</div>`;
}

function renderTrueFalse(node, opts) {
  const groupName = uid('tf', node.question);
  const trueId  = `${groupName}-true`;
  const falseId = `${groupName}-false`;
  const hint    = node.hint ? `<div class="zl-quiz-hint" role="note">💡 ${esc(node.hint)}</div>` : '';
  return `<div class="zl-question" role="group" aria-labelledby="${esc(groupName)}-lbl" data-zl-question="truefalse">\n  <div class="zl-question-text" id="${esc(groupName)}-lbl">${esc(node.question)}</div>\n  <div class="zl-options">\n    <label class="zl-option" for="${esc(trueId)}"><input type="radio" id="${esc(trueId)}" name="${esc(groupName)}" value="true" data-zl-correct="${node.answer === true}"> <span>True</span></label>\n    <label class="zl-option" for="${esc(falseId)}"><input type="radio" id="${esc(falseId)}" name="${esc(groupName)}" value="false" data-zl-correct="${node.answer === false}"> <span>False</span></label>\n  </div>\n  ${hint}\n</div>`;
}

function renderFillBlank(node, opts) {
  const id = uid('blank', node.question);
  const hint = node.hint ? `<div class="zl-quiz-hint" role="note">💡 ${esc(node.hint)}</div>` : '';
  return `<div class="zl-question" data-zl-question="fillblank" data-zl-answer="${esc(node.answer)}">\n  <div class="zl-question-text">${esc(node.question)}</div>\n  <input type="text" id="${esc(id)}" class="zl-input" placeholder="Your answer…" aria-label="${esc(node.question)}" data-zl-blank>\n  ${hint}\n</div>`;
}

function renderMatching(node, opts) {
  const pairs = (node.pairs || []).map(p =>
    `<div class="zl-option">${esc(p.left)} <span style="color:var(--zl-help-color)">→</span> <strong>${esc(p.right)}</strong></div>`
  ).join('');
  return `<div class="zl-question" data-zl-question="matching">\n  <div class="zl-question-text">${esc(node.question || 'Matching')}</div>\n  <div class="zl-options">${pairs}</div>\n</div>`;
}

function renderMatrix(node, opts) {
  const rows = (node.cells || []).map(row => `<div class="zl-option">${esc(row)}</div>`).join('');
  return `<div class="zl-question" data-zl-question="matrix">\n  <div class="zl-question-text">${esc(node.question || 'Matrix')}</div>\n  <div class="zl-options">${rows}</div>\n</div>`;
}

function renderTimer(node, opts) {
  return `<div class="zl-timer" role="timer" aria-live="off" data-zl-timer="${node.duration}">⏱ ${formatDuration(node.duration)}</div>`;
}

// ─── Flashcard deck ───────────────────────────────────────────────────────────

function renderDeck(node, opts) {
  const cards = node.cards || [];
  const count = cards.length;
  if (count === 0) return `<div class="zl-deck" data-zl-deck="${esc(node.name)}"><p>No cards.</p></div>`;

  const first = cards[0];
  const header = `<div class="zl-deck-header"><span>${esc(node.name)}</span><span class="zl-deck-counter" data-zl-deck-counter>1 / ${count}</span></div>`;
  const cardHtml = `<div class="zl-card-viewport" aria-label="Flashcard" role="region"><div class="zl-card-inner" tabindex="0" aria-label="Press Enter or Space to flip" data-zl-card data-zl-card-index="0"><div class="zl-card-face">${esc(first.front)}</div><div class="zl-card-back">${esc(first.back)}</div></div></div>`;
  const nav = `<div class="zl-deck-nav"><button type="button" class="zl-btn zl-btn-secondary" data-zl-deck-prev aria-label="Previous card">&larr;</button><button type="button" class="zl-btn zl-btn-secondary" data-zl-deck-flip aria-label="Flip card">Flip</button><button type="button" class="zl-btn zl-btn-secondary" data-zl-deck-next aria-label="Next card">&rarr;</button></div>`;
  const progressBar = `<div class="zl-deck-progress-bar" aria-hidden="true"><div class="zl-deck-progress-fill" style="width:0%" data-zl-deck-progress></div></div>`;
  // Embed all cards as JSON for the runtime
  const dataScript = `<script type="application/json" data-zl-deck-data>${JSON.stringify(cards.map(c => ({f: c.front, b: c.back})))}</script>`;
  return `<div class="zl-deck" data-zl-deck="${esc(node.name)}">\n${header}\n${cardHtml}\n${nav}\n${progressBar}\n${dataScript}\n</div>`;
}

// ─── Poll ─────────────────────────────────────────────────────────────────────

function renderPoll(node, opts) {
  const inputType = node.multi ? 'checkbox' : 'radio';
  const groupName = uid('poll', node.question);
  const options = (node.options || []).map((opt, i) => {
    const id = `${groupName}-opt-${i}`;
    return `<label class="zl-poll-option" for="${esc(id)}">\n  <input type="${inputType}" id="${esc(id)}" name="${esc(groupName)}" value="${i}">\n  <span>${esc(opt.text)}</span>\n</label>`;
  }).join('\n');
  const anon  = node.anonymous ? ' <span style="font-size:0.8rem;color:var(--zl-help-color)">(anonymous)</span>' : '';
  const question = `<div class="zl-poll-question">${esc(node.question)}${anon}</div>`;
  const submitBtn = `<button type="button" class="zl-btn zl-btn-primary" style="margin-top:0.75rem" data-zl-poll-submit>Vote</button>`;
  return `<div class="zl-poll" data-zl-poll="${esc(node.question)}">\n  ${question}\n  <div class="zl-poll-options" role="${node.multi ? 'group' : 'radiogroup'}" aria-label="${esc(node.question)}">\n${options}\n  </div>\n  ${submitBtn}\n</div>`;
}

// ─── Task list ────────────────────────────────────────────────────────────────

function renderTaskList(node, opts) {
  const items = renderTaskItems(node.items || [], 0);
  return `<div class="zl-tasks" role="list" aria-label="${esc(node.label || 'Task list')}" data-zl-tasks>\n${items}\n</div>`;
}

function renderTaskItems(items, depth) {
  return items.map((item, i) => {
    const id = `zl-task-${depth}-${i}-${uid('t', item.text)}`;
    const checked = item.checked ? ' checked' : '';
    const children = item.children?.length
      ? `\n<div class="zl-task-children" role="list">${renderTaskItems(item.children, depth + 1)}</div>`
      : '';
    return `<div class="zl-task-item" role="listitem" data-zl-task>\n  <label><input type="checkbox"${checked} id="${esc(id)}" aria-label="${esc(item.text)}" data-zl-task-check> <span>${esc(item.text)}</span></label>${children}\n</div>`;
  }).join('\n');
}

// ─── Interactive Tabs ─────────────────────────────────────────────────────────

function renderITabs(node, opts) {
  const tabList = (node.tabs || []).map((tab, i) => {
    const active = i === (node.active || 0) ? ' active' : '';
    return `<button type="button" class="zl-itab-btn${active}" role="tab" aria-selected="${i === (node.active || 0)}" aria-controls="zl-itab-panel-${i}" id="zl-itab-${i}" tabindex="${i === (node.active || 0) ? 0 : -1}">${esc(tab.label)}</button>`;
  }).join('\n');

  const panels = (node.tabs || []).map((tab, i) => {
    const active = i === (node.active || 0) ? ' active' : '';
    const content = (tab.children || []).map(c => renderInteractiveNode(c, opts)).filter(Boolean).join('\n');
    return `<div class="zl-itab-panel${active}" id="zl-itab-panel-${i}" role="tabpanel" aria-labelledby="zl-itab-${i}" ${i !== (node.active || 0) ? 'hidden' : ''}>\n${content}\n</div>`;
  }).join('\n');

  return `<div class="zl-itabs" data-zl-tabs>\n  <div class="zl-itab-strip" role="tablist">\n${tabList}\n  </div>\n${panels}\n</div>`;
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function renderAccordion(node, opts) {
  const sections = (node.sections || []).map(s => {
    const open = s.open ? ' open' : '';
    const content = (s.children || []).map(c => renderInteractiveNode(c, opts)).filter(Boolean).join('\n');
    return `<details class="zl-accordion-section"${open}>\n  <summary>${esc(s.title)}</summary>\n  <div class="zl-accordion-body">\n${content}\n  </div>\n</details>`;
  }).join('\n');
  return `<div class="zl-accordion" data-zl-accordion>\n${sections}\n</div>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/**
 * Check if any nodes in the list need interactive CSS.
 * @param {object[]} nodes
 * @returns {boolean}
 */
export function hasInteractiveNodes(nodes) {
  if (!Array.isArray(nodes)) return false;
  return nodes.some(n => n && Object.values(INTERACTIVE_NODE_TYPES).includes(n.type));
}
