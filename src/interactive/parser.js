/**
 * Zolto Interactive Parser — Phase 10
 *
 * Parses tokenized interactive block content into typed AST nodes.
 * Pure function: no mutable state, no I/O, no throws.
 */

import { TK, tokenizeInteractive } from './tokenizer.js';
import {
  createInteractiveNode, createFormNode, createInputNode, createTextareaNode,
  createButtonNode, createCheckboxNode, createRadioGroupNode, createRadioOptionNode,
  createSelectNode, createSelectOptionNode, createSliderNode, createToggleNode,
  createSegmentNode, createSegmentItemNode, createProgressNode,
  createQuizNode, createMCQNode, createMCQOptionNode, createTrueFalseNode,
  createFillBlankNode, createMatchingNode, createMatchPairNode,
  createMatrixNode, createHintNode, createExplainNode, createTimerNode,
  createFlashcardDeckNode, createFlashcardNode, createPollNode, createPollOptionNode,
  createTaskListNode, createTaskItemNode, createInteractiveTabsNode, createInteractiveTabNode,
  createAccordionNode, createAccordionSectionNode, createStateBlockNode, createStateVarNode,
} from './ast.js';

// ─── Parser state ─────────────────────────────────────────────────────────────

function createParser(tokens) {
  let pos = 0;

  function peek()    { return tokens[pos] ?? { type: TK.EOF, value: null }; }
  function advance() { const t = tokens[pos]; pos++; return t ?? { type: TK.EOF, value: null }; }
  function done()    { return peek().type === TK.EOF; }

  function skipNewlines() {
    while (peek().type === TK.NEWLINE) advance();
  }

  function matchBrace() {
    skipNewlines();
    if (peek().type === TK.OPEN_BRACE) { advance(); return true; }
    return false;
  }

  function expectClose() {
    skipNewlines();
    if (peek().type === TK.CLOSE_BRACE) { advance(); }
  }

  function applyMod(mods, t) {
    if (t.type === TK.MOD_REQUIRED)   mods.required = true;
    if (t.type === TK.MOD_DISABLED)   mods.disabled = true;
    if (t.type === TK.MOD_LOADING)    mods.loading = true;
    if (t.type === TK.MOD_MULTI)      mods.multi = true;
    if (t.type === TK.MOD_SEARCHABLE) mods.searchable = true;
    if (t.type === TK.MOD_ANONYMOUS)  mods.anonymous = true;
    if (t.type === TK.MOD_SHUFFLE)    mods.shuffle = true;
  }

  function applyProp(props, t) {
    if (t.type === TK.PROP_LABEL)       props.label = t.value;
    if (t.type === TK.PROP_PLACEHOLDER) props.placeholder = t.value;
    if (t.type === TK.PROP_VALUE)       props.value = t.value;
    if (t.type === TK.PROP_MIN)         props.min = Number(t.value);
    if (t.type === TK.PROP_MAX)         props.max = Number(t.value);
    if (t.type === TK.PROP_STEP)        props.step = Number(t.value);
    if (t.type === TK.PROP_ROWS)        props.rows = Number(t.value);
    if (t.type === TK.PROP_HELP)        props.help = t.value;
    if (t.type === TK.PROP_ERROR)       props.error = t.value;
    if (t.type === TK.PROP_ANSWER)      props.answer = t.value;
    if (t.type === TK.PROP_DIFFICULTY)  props.difficulty = t.value;
    if (t.type === TK.PROP_TAGS)        props.tags = t.value ? t.value.split(',').map(s => s.trim()) : [];
    if (t.type === TK.PROP_FRONT)       props.front = t.value;
    if (t.type === TK.PROP_BACK)        props.back = t.value;
    if (t.type === TK.PROP_ARIA)        props.ariaLabel = t.value;
    if (t.type === TK.PROP_DESCRIPTION) props.description = t.value;
  }

  function collectModsProps() {
    const mods = { required: false, disabled: false, loading: false, multi: false,
                   searchable: false, anonymous: false, shuffle: false };
    const props = {};
    while (!done()) {
      skipNewlines();
      const t = peek();
      if (t.type === TK.EOF || t.type === TK.CLOSE_BRACE) break;
      const isMod = [TK.MOD_REQUIRED, TK.MOD_DISABLED, TK.MOD_LOADING, TK.MOD_MULTI,
                     TK.MOD_SEARCHABLE, TK.MOD_ANONYMOUS, TK.MOD_SHUFFLE].includes(t.type);
      const isProp = [TK.PROP_LABEL, TK.PROP_PLACEHOLDER, TK.PROP_VALUE, TK.PROP_MIN,
                      TK.PROP_MAX, TK.PROP_STEP, TK.PROP_ROWS, TK.PROP_HELP, TK.PROP_ERROR,
                      TK.PROP_ANSWER, TK.PROP_DIFFICULTY, TK.PROP_TAGS, TK.PROP_FRONT,
                      TK.PROP_BACK, TK.PROP_ARIA, TK.PROP_DESCRIPTION].includes(t.type);
      if (isMod)  { advance(); applyMod(mods, t); continue; }
      if (isProp) { advance(); applyProp(props, t); continue; }
      break;
    }
    return { mods, props };
  }

  return { peek, advance, done, skipNewlines, matchBrace, expectClose, collectModsProps };
}

// ─── Top-level parse function ─────────────────────────────────────────────────

export function parseInteractiveSource(src) {
  const tokens = tokenizeInteractive(src);
  const p = createParser(tokens);
  const nodes = [];

  while (!p.done()) {
    p.skipNewlines();
    if (p.done()) break;
    const node = parseNode(p);
    if (node) nodes.push(node);
  }
  return nodes;
}

// ─── Node dispatch ────────────────────────────────────────────────────────────

function parseNode(p) {
  const t = p.peek();
  switch (t.type) {
    case TK.KW_INTERACTIVE: return parseInteractive(p);
    case TK.KW_FORM:        return parseForm(p);
    case TK.KW_TEXT:        return parseInput(p, 'text');
    case TK.KW_EMAIL:       return parseInput(p, 'email');
    case TK.KW_PASSWORD:    return parseInput(p, 'password');
    case TK.KW_NUMBER:      return parseInput(p, 'number');
    case TK.KW_SEARCH:      return parseInput(p, 'search');
    case TK.KW_DATE:        return parseInput(p, 'date');
    case TK.KW_TIME:        return parseInput(p, 'time');
    case TK.KW_TEXTAREA:    return parseTextarea(p);
    case TK.KW_CHECK:       return parseCheckbox(p);
    case TK.KW_RADIO:       return parseRadioGroup(p);
    case TK.KW_SELECT:      return parseSelect(p);
    case TK.KW_BUTTON:      return parseButton(p);
    case TK.KW_TOGGLE:      return parseToggle(p, 'toggle');
    case TK.KW_SWITCH:      return parseToggle(p, 'switch');
    case TK.KW_SEGMENT:     return parseSegment(p);
    case TK.KW_SLIDER:      return parseSlider(p);
    case TK.KW_PROGRESS:    return parseProgress(p);
    case TK.KW_QUIZ:        return parseQuiz(p);
    case TK.KW_MCQ:         return parseMCQ(p, false);
    case TK.KW_MULTI:       return parseMCQ(p, true);
    case TK.KW_TRUEFALSE:   return parseTrueFalse(p);
    case TK.KW_BLANK:       return parseFillBlank(p);
    case TK.KW_MATCH:       return parseMatching(p);
    case TK.KW_MATRIX:      return parseMatrix(p);
    case TK.KW_HINT:        return parseHintExplain(p, 'hint');
    case TK.KW_EXPLAIN:     return parseHintExplain(p, 'explain');
    case TK.KW_TIMER:       return parseTimer(p);
    case TK.KW_DECK:        return parseDeck(p);
    case TK.KW_POLL:        return parsePoll(p);
    case TK.KW_TASKS:       return parseTasks(p);
    case TK.KW_TABS:        return parseTabs(p);
    case TK.KW_ACCORDION:   return parseAccordion(p);
    case TK.KW_STATE:       return parseState(p, 'local');
    case TK.KW_SHARED:      return parseState(p, 'shared');
    default:
      p.advance();
      return null;
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseInteractive(p) {
  const tok = p.advance();
  const meta = tok.value ? parseMetaStr(tok.value) : {};
  p.skipNewlines();
  p.matchBrace();
  const children = [];
  while (!p.done()) {
    p.skipNewlines();
    if (p.peek().type === TK.CLOSE_BRACE || p.peek().type === TK.EOF) break;
    const n = parseNode(p);
    if (n) children.push(n);
  }
  p.expectClose();
  return createInteractiveNode(children, meta);
}

function parseForm(p) {
  const tok = p.advance();
  const rawValue = tok.value || '';
  const name = rawValue.replace(/\s*\{.*/, '').trim() || 'form';
  p.skipNewlines();
  p.matchBrace();
  const children = [];
  while (!p.done()) {
    p.skipNewlines();
    if (p.peek().type === TK.CLOSE_BRACE || p.peek().type === TK.EOF) break;
    const n = parseNode(p);
    if (n) children.push(n);
  }
  p.expectClose();
  return createFormNode(name, children);
}

function parseInput(p, inputType) {
  const tok = p.advance();
  const parts = (tok.value || '').trim().split(/\s+/);
  const name = parts[0] || 'input';
  const inlineMods = parseInlineParts(parts.slice(1));
  const { mods, props } = p.collectModsProps();
  mergeMods(mods, inlineMods.mods);
  return createInputNode(inputType, name, {
    label:       props.label  || inlineMods.label  || null,
    placeholder: props.placeholder || null,
    value:       props.value  || null,
    required:    mods.required,
    disabled:    mods.disabled,
    min:         props.min    !== undefined ? props.min : null,
    max:         props.max    !== undefined ? props.max : null,
    step:        props.step   !== undefined ? props.step : null,
    help:        props.help   || null,
    error:       props.error  || null,
    ariaLabel:   props.ariaLabel || null,
    description: props.description || null,
  });
}

function parseTextarea(p) {
  const tok = p.advance();
  const parts = (tok.value || '').trim().split(/\s+/);
  const name = parts[0] || 'textarea';
  const { mods, props } = p.collectModsProps();
  return createTextareaNode(name, {
    label:       props.label || null,
    placeholder: props.placeholder || null,
    value:       props.value || null,
    required:    mods.required,
    disabled:    mods.disabled,
    rows:        props.rows || 4,
    help:        props.help || null,
    error:       props.error || null,
    ariaLabel:   props.ariaLabel || null,
  });
}

function parseButton(p) {
  const tok = p.advance();
  const parts = splitRespectingQuotes(tok.value || '');
  let variant = 'primary', name = '', label = '';
  const VARIANTS = new Set(['primary','secondary','ghost','danger','outline','icon']);
  if (VARIANTS.has(parts[0])) {
    variant = parts[0];
    const rest = parts.slice(1);
    if (rest.length === 0) { name = variant; label = variant; }
    else if (rest.length === 1) { label = rest[0]; name = rest[0]; }
    else { name = rest[0]; label = rest.slice(1).join(' '); }
  } else {
    name = parts[0] || 'btn'; label = parts.slice(1).join(' ') || name;
  }
  const modsFound = { loading: false, disabled: false, btnType: 'button' };
  for (const pt of parts) {
    if (pt === 'loading')  modsFound.loading = true;
    if (pt === 'disabled') modsFound.disabled = true;
    if (pt === 'submit')   modsFound.btnType = 'submit';
    if (pt === 'reset')    modsFound.btnType = 'reset';
  }
  p.skipNewlines();
  const { mods, props } = p.collectModsProps();
  return createButtonNode(variant, name, props.label || label, {
    btnType:  props.btnType || modsFound.btnType,
    disabled: modsFound.disabled || mods.disabled,
    loading:  modsFound.loading  || mods.loading,
    icon:     props.icon || null,
    ariaLabel:props.ariaLabel || null,
  });
}

function parseCheckbox(p) {
  const tok = p.advance();
  const parts = (tok.value || '').trim().split(/\s+/);
  const name = parts[0] || 'check';
  const { mods, props } = p.collectModsProps();
  return createCheckboxNode(name, {
    label:    props.label || null,
    checked:  false,
    required: mods.required,
    disabled: mods.disabled,
    help:     props.help || null,
    error:    props.error || null,
  });
}

function parseRadioGroup(p) {
  const tok = p.advance();
  const name = (tok.value || '').replace(/\s*\{.*/, '').trim() || 'radio';
  p.skipNewlines();
  p.matchBrace();
  const options = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_OPTION) {
      const ot = p.advance();
      const oparts = splitRespectingQuotes(ot.value || '');
      const val = oparts[0] || '';
      const label = oparts.slice(1).join(' ') || val;
      options.push(createRadioOptionNode(val, label));
    } else { p.advance(); }
  }
  p.expectClose();
  return createRadioGroupNode(name, options);
}

function parseSelect(p) {
  const tok = p.advance();
  const rawVal = tok.value || '';
  const name = rawVal.replace(/\s*(multi|searchable|\{).*/i, '').trim() || 'select';
  const multi = /multi/i.test(rawVal);
  const searchable = /searchable/i.test(rawVal);
  p.skipNewlines();
  p.matchBrace();
  const options = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_OPTION) {
      const ot = p.advance();
      const oparts = splitRespectingQuotes(ot.value || '');
      const val = oparts[0] || '';
      const label = oparts.slice(1).join(' ') || val;
      options.push(createSelectOptionNode(val, label));
    } else { p.advance(); }
  }
  p.expectClose();
  const { props } = p.collectModsProps();
  return createSelectNode(name, options, { multi, searchable, label: props.label || null });
}

function parseToggle(p, subtype) {
  const tok = p.advance();
  const name = (tok.value || '').trim() || subtype;
  const { mods, props } = p.collectModsProps();
  return createToggleNode(name, { subtype, label: props.label || null, disabled: mods.disabled });
}

function parseSegment(p) {
  const tok = p.advance();
  const name = (tok.value || '').replace(/\s*\{.*/, '').trim() || 'segment';
  p.skipNewlines();
  p.matchBrace();
  const items = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_ITEM) {
      const it = p.advance();
      items.push(createSegmentItemNode((it.value || '').trim()));
    } else { p.advance(); }
  }
  p.expectClose();
  return createSegmentNode(name, items);
}

function parseSlider(p) {
  const tok = p.advance();
  const rawVal = tok.value || '';
  const compactM = /^(\S+)\s+(-?\d+)\.\.(-?\d+)(?:\s+step\s+(-?\d+))?$/.exec(rawVal.trim());
  let name, min, max, step;
  if (compactM) {
    name = compactM[1]; min = Number(compactM[2]); max = Number(compactM[3]);
    step = compactM[4] ? Number(compactM[4]) : 1;
    p.skipNewlines();
    const { props } = p.collectModsProps();
    return createSliderNode(name, { min, max, step, label: props.label || null });
  }
  name = rawVal.trim() || 'slider';
  p.skipNewlines();
  const hasBrace = p.peek().type === TK.OPEN_BRACE;
  if (hasBrace) p.advance();
  const { props } = p.collectModsProps();
  if (hasBrace) { p.skipNewlines(); p.expectClose(); }
  return createSliderNode(name, {
    min: props.min !== undefined ? props.min : 0,
    max: props.max !== undefined ? props.max : 100,
    step: props.step !== undefined ? props.step : 1,
    label: props.label || null,
  });
}

function parseProgress(p) {
  const tok = p.advance();
  const m = /^(\S+)\s+(\d+(?:\.\d+)?)%?$/.exec((tok.value || '').trim());
  if (m) return createProgressNode(m[1], Number(m[2]));
  return createProgressNode((tok.value || '').trim() || 'progress', 0);
}

function parseQuiz(p) {
  const tok = p.advance();
  const rawTitle = (tok.value || '').replace(/\s*\{.*/, '').trim();
  const title = rawTitle.startsWith('"') ? rawTitle.slice(1, -1) : rawTitle;
  p.skipNewlines();
  p.matchBrace();
  const questions = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    const qn = parseNode(p);
    if (qn) questions.push(qn);
  }
  p.expectClose();
  return createQuizNode(title, questions);
}

function parseMCQ(p, multi) {
  const tok = p.advance();
  const rawQ = (tok.value || '').replace(/\s*\{.*/, '').trim();
  const question = rawQ.startsWith('"') ? rawQ.slice(1, -1) : rawQ;
  p.skipNewlines();
  p.matchBrace();
  const options = [];
  let hintNode = null, explainNode = null;
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_CORRECT) {
      const ot = p.advance();
      options.push(createMCQOptionNode(stripQuotes(ot.value || ''), true));
    } else if (t.type === TK.KW_CHOICE) {
      const ot = p.advance();
      options.push(createMCQOptionNode(stripQuotes(ot.value || ''), false));
    } else if (t.type === TK.KW_HINT) {
      hintNode = parseHintExplain(p, 'hint');
    } else if (t.type === TK.KW_EXPLAIN) {
      explainNode = parseHintExplain(p, 'explain');
    } else { p.advance(); }
  }
  p.expectClose();
  const node = createMCQNode(question, options, { multi });
  if (hintNode)    node.hint    = hintNode.text;
  if (explainNode) node.explain = explainNode.text;
  return node;
}

function parseTrueFalse(p) {
  const tok = p.advance();
  const question = stripQuotes((tok.value || '').trim());
  const { props } = p.collectModsProps();
  const answer = props.answer === 'true' || props.answer === true;
  return createTrueFalseNode(question, answer, { hint: props.hint || null, explain: props.explain || null });
}

function parseFillBlank(p) {
  const tok = p.advance();
  const question = stripQuotes((tok.value || '').trim());
  const { props } = p.collectModsProps();
  return createFillBlankNode(question, props.answer || '', { hint: props.hint || null });
}

function parseMatching(p) {
  const tok = p.advance();
  const question = stripQuotes((tok.value || '').replace(/\{/, '').trim());
  p.skipNewlines();
  p.matchBrace();
  const pairs = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.MATCH_PAIR) {
      const pt = p.advance();
      pairs.push(createMatchPairNode(pt.left, pt.right));
    } else { p.advance(); }
  }
  p.expectClose();
  return createMatchingNode(question, pairs);
}

function parseMatrix(p) {
  const tok = p.advance();
  const question = stripQuotes((tok.value || '').replace(/\{/, '').trim());
  p.skipNewlines();
  p.matchBrace();
  const rawLines = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    rawLines.push(t.value || '');
    p.advance();
  }
  p.expectClose();
  return createMatrixNode(question, [], [], rawLines);
}

function parseHintExplain(p, kind) {
  const tok = p.advance();
  let text = (tok.value || '').trim();
  if (!text) {
    const STOPS = new Set([TK.CLOSE_BRACE, TK.KW_EXPLAIN, TK.KW_HINT, TK.EOF]);
    const lines = [];
    p.skipNewlines();
    while (!p.done()) {
      const t = p.peek();
      if (STOPS.has(t.type)) break;
      if (t.type === TK.NEWLINE) { p.advance(); continue; }
      lines.push(t.value || '');
      p.advance();
    }
    if (p.peek().type === TK.CLOSE_BRACE) p.advance();
    text = lines.join(' ').trim();
  }
  return kind === 'hint' ? createHintNode(text) : createExplainNode(text);
}

function parseTimer(p) {
  const tok = p.advance();
  return createTimerNode((tok.value || '').trim());
}

function parseDeck(p) {
  const tok = p.advance();
  const name = (tok.value || '').replace(/\{/, '').trim() || 'deck';
  p.skipNewlines();
  p.matchBrace();
  const cards = [];
  let deckOpts = {};
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_CARD) {
      p.advance();
      p.skipNewlines();
      const { props } = p.collectModsProps();
      p.skipNewlines();
      if (p.peek().type === TK.CLOSE_BRACE) p.advance();
      cards.push(createFlashcardNode(
        props.front || '', props.back || '',
        { difficulty: props.difficulty || null, tags: props.tags || [] }
      ));
    } else if (t.type === TK.PROP_DIFFICULTY) {
      const dt = p.advance();
      deckOpts.difficulty = dt.value || null;
    } else if (t.type === TK.PROP_TAGS) {
      const tt = p.advance();
      deckOpts.tags = tt.value ? tt.value.split(',').map(s => s.trim()) : [];
    } else { p.advance(); }
  }
  p.expectClose();
  return createFlashcardDeckNode(name, cards, deckOpts);
}

function parsePoll(p) {
  const tok = p.advance();
  const rawVal = tok.value || '';
  const multi = /multi/i.test(rawVal);
  const question = stripQuotes(rawVal.replace(/\s*multi\s*/i, '').replace(/\{/, '').trim());
  p.skipNewlines();
  p.matchBrace();
  const options = [];
  let anonymous = false;
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.MOD_ANONYMOUS) { anonymous = true; p.advance(); continue; }
    if (t.type === TK.TEXT || t.type === TK.STRING) {
      options.push(createPollOptionNode(t.value || ''));
      p.advance();
    } else { p.advance(); }
  }
  p.expectClose();
  return createPollNode(question, options, { multi, anonymous });
}

function parseTasks(p) {
  const tok = p.advance();
  p.skipNewlines();
  const hasBrace = p.peek().type === TK.OPEN_BRACE || (tok.value || '').includes('{');
  if (hasBrace && p.peek().type === TK.OPEN_BRACE) p.advance();
  const items = parseTaskItems(p, 0);
  if (hasBrace) { p.skipNewlines(); p.expectClose(); }
  return createTaskListNode(items);
}

function parseTaskItems(p, baseIndent) {
  const items = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.EOF || t.type === TK.CLOSE_BRACE) break;
    if (t.type !== TK.TASK_ITEM_OPEN && t.type !== TK.TASK_ITEM_DONE) break;
    const itemIndent = t.indent || 0;
    if (itemIndent < baseIndent) break;
    p.advance();
    const checked = t.type === TK.TASK_ITEM_DONE;
    const children = parseTaskItems(p, itemIndent + 1);
    items.push(createTaskItemNode(t.value || '', checked, children));
  }
  return items;
}

function parseTabs(p) {
  const tok = p.advance();
  p.skipNewlines();
  p.matchBrace();
  const tabNodes = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_TAB) {
      const tt = p.advance();
      const label = stripQuotes((tt.value || '').trim());
      p.skipNewlines();
      const children = [];
      while (!p.done()) {
        p.skipNewlines();
        const inner = p.peek();
        if (inner.type === TK.KW_TAB || inner.type === TK.CLOSE_BRACE || inner.type === TK.EOF) break;
        const cn = parseNode(p);
        if (cn) children.push(cn);
      }
      tabNodes.push(createInteractiveTabNode(label, children));
    } else { p.advance(); }
  }
  p.expectClose();
  return createInteractiveTabsNode(tabNodes);
}

function parseAccordion(p) {
  const tok = p.advance();
  p.skipNewlines();
  p.matchBrace();
  const sections = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    if (t.type === TK.KW_SECTION) {
      const st = p.advance();
      const title = stripQuotes((st.value || '').trim());
      p.skipNewlines();
      const children = [];
      while (!p.done()) {
        p.skipNewlines();
        const inner = p.peek();
        if (inner.type === TK.KW_SECTION || inner.type === TK.CLOSE_BRACE || inner.type === TK.EOF) break;
        const cn = parseNode(p);
        if (cn) children.push(cn);
      }
      sections.push(createAccordionSectionNode(title, children));
    } else { p.advance(); }
  }
  p.expectClose();
  return createAccordionNode(sections);
}

function parseState(p, scope) {
  p.advance();
  p.skipNewlines();
  p.matchBrace();
  const vars = [];
  while (!p.done()) {
    p.skipNewlines();
    const t = p.peek();
    if (t.type === TK.CLOSE_BRACE || t.type === TK.EOF) break;
    const text = (t.value || '');
    const eqM = /^(\w+)\s*=\s*(.+)$/.exec(text);
    if (eqM) {
      const varName = eqM[1];
      const rawVal = eqM[2].trim();
      let val = rawVal;
      if (rawVal === 'true')  val = true;
      else if (rawVal === 'false') val = false;
      else if (!isNaN(Number(rawVal))) val = Number(rawVal);
      else val = stripQuotes(rawVal);
      vars.push(createStateVarNode(varName, val));
    }
    p.advance();
  }
  p.expectClose();
  return createStateBlockNode(vars, { scope });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripQuotes(s) {
  if (!s) return '';
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function splitRespectingQuotes(str) {
  const parts = [];
  let current = '';
  let inQ = false;
  let qChar = '';
  for (const ch of (str || '')) {
    if (!inQ && (ch === '"' || ch === "'")) { inQ = true; qChar = ch; continue; }
    if (inQ && ch === qChar) { inQ = false; parts.push(current); current = ''; continue; }
    if (!inQ && ch === ' ') { if (current) { parts.push(current); current = ''; } continue; }
    current += ch;
  }
  if (current) parts.push(current);
  return parts;
}

function parseInlineParts(parts) {
  const mods = { required: false, disabled: false, loading: false };
  let label = null;
  for (const p of parts) {
    if (p === 'required') mods.required = true;
    if (p === 'disabled') mods.disabled = true;
    if (p === 'loading')  mods.loading = true;
    if (p.startsWith('"') || p.startsWith("'")) label = stripQuotes(p);
  }
  return { mods, label };
}

function mergeMods(target, source) {
  for (const k of Object.keys(source)) {
    if (source[k]) target[k] = source[k];
  }
}

function parseMetaStr(str) {
  const meta = {};
  const idM = /id="([^"]*)"/.exec(str) || /id='([^']*)'/.exec(str);
  if (idM) meta.id = idM[1];
  return meta;
}
