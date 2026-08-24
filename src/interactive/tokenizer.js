/**
 * Zolto Interactive Tokenizer — Phase 10
 *
 * Tokenizes the raw content string inside an INTERACTIVE_BLOCK.
 * Produces a flat array of typed tokens for the parser.
 */

export const TK = Object.freeze({
  // Block-level keywords
  KW_INTERACTIVE:  'kw_interactive',
  KW_FORM:         'kw_form',
  KW_TEXT:         'kw_text',
  KW_EMAIL:        'kw_email',
  KW_PASSWORD:     'kw_password',
  KW_NUMBER:       'kw_number',
  KW_SEARCH:       'kw_search',
  KW_DATE:         'kw_date',
  KW_TIME:         'kw_time',
  KW_TEXTAREA:     'kw_textarea',
  KW_CHECK:        'kw_check',
  KW_RADIO:        'kw_radio',
  KW_SELECT:       'kw_select',
  KW_BUTTON:       'kw_button',
  KW_TOGGLE:       'kw_toggle',
  KW_SWITCH:       'kw_switch',
  KW_SEGMENT:      'kw_segment',
  KW_SLIDER:       'kw_slider',
  KW_PROGRESS:     'kw_progress',
  KW_QUIZ:         'kw_quiz',
  KW_MCQ:          'kw_mcq',
  KW_MULTI:        'kw_multi',
  KW_TRUEFALSE:    'kw_truefalse',
  KW_BLANK:        'kw_blank',
  KW_MATCH:        'kw_match',
  KW_MATRIX:       'kw_matrix',
  KW_HINT:         'kw_hint',
  KW_EXPLAIN:      'kw_explain',
  KW_TIMER:        'kw_timer',
  KW_DECK:         'kw_deck',
  KW_CARD:         'kw_card',
  KW_POLL:         'kw_poll',
  KW_TASKS:        'kw_tasks',
  KW_TABS:         'kw_tabs',
  KW_TAB:          'kw_tab',
  KW_ACCORDION:    'kw_accordion',
  KW_SECTION:      'kw_section',
  KW_STATE:        'kw_state',
  KW_SHARED:       'kw_shared',
  KW_OPTION:       'kw_option',
  KW_CORRECT:      'kw_correct',
  KW_CHOICE:       'kw_choice',
  KW_ITEM:         'kw_item',
  // Modifier keywords (inline)
  MOD_REQUIRED:    'mod_required',
  MOD_DISABLED:    'mod_disabled',
  MOD_LOADING:     'mod_loading',
  MOD_MULTI:       'mod_multi',
  MOD_SEARCHABLE:  'mod_searchable',
  MOD_ANONYMOUS:   'mod_anonymous',
  MOD_SHUFFLE:     'mod_shuffle',
  MOD_CASESENSITIVE: 'mod_casesensitive',
  // Property keywords (take a value argument)
  PROP_LABEL:      'prop_label',
  PROP_PLACEHOLDER:'prop_placeholder',
  PROP_VALUE:      'prop_value',
  PROP_MIN:        'prop_min',
  PROP_MAX:        'prop_max',
  PROP_STEP:       'prop_step',
  PROP_ROWS:       'prop_rows',
  PROP_HELP:       'prop_help',
  PROP_ERROR:      'prop_error',
  PROP_ANSWER:     'prop_answer',
  PROP_DIFFICULTY: 'prop_difficulty',
  PROP_TAGS:       'prop_tags',
  PROP_FRONT:      'prop_front',
  PROP_BACK:       'prop_back',
  PROP_ARIA:       'prop_aria',
  PROP_DESCRIPTION:'prop_description',
  // Range syntax
  RANGE:           'range',   // e.g. 0..100
  // Structural
  OPEN_BRACE:      'open_brace',
  CLOSE_BRACE:     'close_brace',
  TASK_ITEM_OPEN:  'task_item_open',   // [ ] text
  TASK_ITEM_DONE:  'task_item_done',   // [x] text
  MATCH_PAIR:      'match_pair',       // Left -> Right
  ARROW:           'arrow',
  // Literals
  STRING:          'string',
  NUMBER:          'number',
  BOOL:            'bool',
  IDENT:           'ident',
  TEXT:            'text',
  NEWLINE:         'newline',
  EOF:             'eof',
});

const KEYWORD_MAP = {
  interactive: TK.KW_INTERACTIVE,
  form:        TK.KW_FORM,
  text:        TK.KW_TEXT,
  email:       TK.KW_EMAIL,
  password:    TK.KW_PASSWORD,
  number:      TK.KW_NUMBER,
  search:      TK.KW_SEARCH,
  date:        TK.KW_DATE,
  time:        TK.KW_TIME,
  textarea:    TK.KW_TEXTAREA,
  check:       TK.KW_CHECK,
  radio:       TK.KW_RADIO,
  select:      TK.KW_SELECT,
  button:      TK.KW_BUTTON,
  toggle:      TK.KW_TOGGLE,
  switch:      TK.KW_SWITCH,
  segment:     TK.KW_SEGMENT,
  slider:      TK.KW_SLIDER,
  progress:    TK.KW_PROGRESS,
  quiz:        TK.KW_QUIZ,
  mcq:         TK.KW_MCQ,
  multi:       TK.KW_MULTI,
  truefalse:   TK.KW_TRUEFALSE,
  blank:       TK.KW_BLANK,
  match:       TK.KW_MATCH,
  matrix:      TK.KW_MATRIX,
  hint:        TK.KW_HINT,
  explain:     TK.KW_EXPLAIN,
  timer:       TK.KW_TIMER,
  deck:        TK.KW_DECK,
  card:        TK.KW_CARD,
  poll:        TK.KW_POLL,
  tasks:       TK.KW_TASKS,
  tabs:        TK.KW_TABS,
  tab:         TK.KW_TAB,
  accordion:   TK.KW_ACCORDION,
  section:     TK.KW_SECTION,
  state:       TK.KW_STATE,
  shared:      TK.KW_SHARED,
  option:      TK.KW_OPTION,
  correct:     TK.KW_CORRECT,
  choice:      TK.KW_CHOICE,
  item:        TK.KW_ITEM,
  required:    TK.MOD_REQUIRED,
  disabled:    TK.MOD_DISABLED,
  loading:     TK.MOD_LOADING,
  searchable:  TK.MOD_SEARCHABLE,
  anonymous:   TK.MOD_ANONYMOUS,
  shuffle:     TK.MOD_SHUFFLE,
  label:       TK.PROP_LABEL,
  placeholder: TK.PROP_PLACEHOLDER,
  value:       TK.PROP_VALUE,
  min:         TK.PROP_MIN,
  max:         TK.PROP_MAX,
  step:        TK.PROP_STEP,
  rows:        TK.PROP_ROWS,
  help:        TK.PROP_HELP,
  error:       TK.PROP_ERROR,
  answer:      TK.PROP_ANSWER,
  difficulty:  TK.PROP_DIFFICULTY,
  tags:        TK.PROP_TAGS,
  front:       TK.PROP_FRONT,
  back:        TK.PROP_BACK,
  aria:        TK.PROP_ARIA,
  description: TK.PROP_DESCRIPTION,
};

const BLOCK_OPENERS = new Set([
  TK.KW_INTERACTIVE, TK.KW_FORM, TK.KW_RADIO, TK.KW_SELECT,
  TK.KW_SEGMENT, TK.KW_QUIZ, TK.KW_MCQ, TK.KW_MULTI, TK.KW_MATCH,
  TK.KW_MATRIX, TK.KW_DECK, TK.KW_CARD, TK.KW_POLL, TK.KW_TASKS,
  TK.KW_TABS, TK.KW_TAB, TK.KW_ACCORDION, TK.KW_SECTION,
  TK.KW_STATE, TK.KW_SHARED, TK.KW_HINT, TK.KW_EXPLAIN,
]);
export { BLOCK_OPENERS };

/**
 * Tokenize an interactive block body string into tokens.
 * @param {string} src
 * @returns {Array<{type:string, value:string|null, line:number}>}
 */
export function tokenizeInteractive(src) {
  const lines = String(src || '').split('\n');
  const tokens = [];

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const line = raw.trim();
    const lineNum = li + 1;

    // Blank line
    if (!line) {
      tokens.push({ type: TK.NEWLINE, value: null, line: lineNum });
      continue;
    }

    // Task item: [ ] text or [x] text (may be indented)
    const taskOpen = /^\s*\[ \]\s+(.+)$/.exec(raw);
    const taskDone = /^\s*\[x\]\s+(.+)$/i.exec(raw);
    const indent = (raw.match(/^(\s*)/) || ['', ''])[1].length;
    if (taskOpen) {
      tokens.push({ type: TK.TASK_ITEM_OPEN, value: taskOpen[1].trim(), line: lineNum, indent });
      continue;
    }
    if (taskDone) {
      tokens.push({ type: TK.TASK_ITEM_DONE, value: taskDone[1].trim(), line: lineNum, indent });
      continue;
    }

    // Match pair: Left -> Right
    const matchPair = /^(.+?)\s*->\s*(.+)$/.exec(line);
    if (matchPair && !line.startsWith('@')) {
      tokens.push({ type: TK.MATCH_PAIR, value: null, left: matchPair[1].trim(), right: matchPair[2].trim(), line: lineNum });
      continue;
    }

    // Directive: @keyword [rest]
    const directiveM = /^@([\w-]+)\s*(.*)$/.exec(line);
    if (directiveM) {
      const kw = directiveM[1].toLowerCase();
      const rest = directiveM[2].trim();
      const kwType = KEYWORD_MAP[kw];
      if (kwType) {
        tokens.push({ type: kwType, value: rest || null, line: lineNum });
      } else {
        // Unknown @directive → treat as text
        tokens.push({ type: TK.TEXT, value: line, line: lineNum });
      }
      continue;
    }

    // Property keyword on its own line: label "...", min 0, etc.
    const propM = /^(label|placeholder|value|min|max|step|rows|help|error|answer|difficulty|tags|front|back|aria|description)\s+(.+)$/i.exec(line);
    if (propM) {
      const propKey = propM[1].toLowerCase();
      const propType = KEYWORD_MAP[propKey];
      tokens.push({ type: propType, value: stripQuotes(propM[2].trim()), line: lineNum });
      continue;
    }

    // Modifier keyword on its own line
    const modM = /^(required|disabled|loading|multi|searchable|anonymous|shuffle|casesensitive)$/i.exec(line);
    if (modM) {
      const modKey = modM[1].toLowerCase();
      tokens.push({ type: modKey === 'casesensitive' ? TK.MOD_CASESENSITIVE : (KEYWORD_MAP[modKey] || TK.IDENT), value: modKey, line: lineNum });
      continue;
    }

    // Opening brace
    if (line === '{') { tokens.push({ type: TK.OPEN_BRACE, value: null, line: lineNum }); continue; }
    if (line === '}') { tokens.push({ type: TK.CLOSE_BRACE, value: null, line: lineNum }); continue; }

    // end keyword
    if (line.toLowerCase() === 'end' || line === '}') {
      tokens.push({ type: TK.CLOSE_BRACE, value: null, line: lineNum }); continue;
    }

    // Range: 0..100
    const rangeM = /^(-?\d+)\.\.(-?\d+)(?:\s+step\s+(-?\d+))?$/.exec(line);
    if (rangeM) {
      tokens.push({ type: TK.RANGE, value: null, min: Number(rangeM[1]), max: Number(rangeM[2]), step: rangeM[3] ? Number(rangeM[3]) : 1, line: lineNum });
      continue;
    }

    // String literal
    if ((line.startsWith('"') && line.endsWith('"')) || (line.startsWith("'") && line.endsWith("'"))) {
      tokens.push({ type: TK.STRING, value: line.slice(1, -1), line: lineNum });
      continue;
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(line)) {
      tokens.push({ type: TK.NUMBER, value: Number(line), line: lineNum });
      continue;
    }

    // Bool
    if (line === 'true' || line === 'false') {
      tokens.push({ type: TK.BOOL, value: line === 'true', line: lineNum });
      continue;
    }

    // General text / identifier
    tokens.push({ type: TK.TEXT, value: line, line: lineNum });
  }

  tokens.push({ type: TK.EOF, value: null, line: lines.length });
  return tokens;
}

function stripQuotes(s) {
  if (!s) return '';
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}
