/**
 * Regression tests for the deep optimization/security audit pass.
 * Each test documents a real bug found and fixed, so it can't silently
 * regress.
 */
import { createSuite, assert, eq } from '../runner.js';
import { escapeAttr } from '../../src/tokenizer.js';
import { renderVectorSvgNode } from '../../src/vector/svg.js';
import { buildTransformString } from '../../src/vector/transforms.js';
import { parseJSONData } from '../../src/chart/datasets.js';
import { parseAnimationSource } from '../../src/animation/parser.js';
import { ComponentRegistry } from '../../src/component/registry.js';
import { renderComponentNode } from '../../src/component/renderer.js';
import { expandMacro } from '../../src/component/macros.js';
import { parseLiteralValue } from '../../src/component/props.js';
import { parseComponent, renderComponent } from '../../src/zolto.js';
import { parseInteractive, renderInteractive } from '../../src/interactive/index.js';
import { parseInteractiveSource } from '../../src/interactive/parser.js';
import { ZOLTO_RUNTIME_JS } from '../../src/export/js-bundle-export.js';
import { initZoltoInteractivity } from '../../src/interactive/runtime.js';
import { readFileSync } from 'fs';

const suite = createSuite('Security & Deep Audit Regressions');

suite.test('SECURITY: escapeAttr blocks javascript: URLs with embedded tab/newline/CR bypass characters', () => {
  // Browsers strip ASCII tab/newline/CR from a URL before parsing its
  // scheme, so "java\tscript:" is executed as "javascript:" by a real
  // browser even though it doesn't match a naive regex against the raw
  // string. This is the single most common XSS attack surface in a
  // Markdown-like language (link and image URLs).
  eq(escapeAttr('java\tscript:alert(1)'), '#');
  eq(escapeAttr('java\nscript:alert(1)'), '#');
  eq(escapeAttr('java\rscript:alert(1)'), '#');
  eq(escapeAttr('javascript:alert(1)'), '#');
  eq(escapeAttr('data:text/html,<script>alert(1)</script>'), '#');
  eq(escapeAttr('https://example.com/path'), 'https://example.com/path');
});

suite.test('BUG: vector circle/ellipse at the origin with zero radius render their real coordinates', () => {
  // node.cx || node.x treated an explicit cx=0 as absent (0 is falsy),
  // silently substituting node.x instead — a shape deliberately
  // positioned at the origin, or with radius 0 (a valid animation
  // start/end state), rendered at the wrong position or size.
  const circle = renderVectorSvgNode({ type: 'vector_shape', shape: 'circle', cx: 0, cy: 0, r: 0, fill: 'red' });
  assert(circle.includes('cx="0"') && circle.includes('cy="0"') && circle.includes('r="0"'), 'circle at the origin with zero radius should keep all three zeros');

  const rect = renderVectorSvgNode({ type: 'vector_shape', shape: 'rect', x: 0, y: 0, w: 10, h: 10, radius: 0, fill: 'green' });
  assert(rect.includes('rx="0"'), 'rect with an explicit radius=0 should not fall through to a different default');
});

suite.test('BUG: vector scale=0 renders scale(0) instead of being silently dropped', () => {
  const tf = buildTransformString({ scale: 0 });
  eq(tf, 'scale(0)');
});

suite.test('BUG: chart JSON data with x=0 or value=0 keeps the real value instead of an auto-generated label', () => {
  const result = parseJSONData(JSON.stringify([{ x: 0, value: 0 }, { x: 1, value: 5 }]));
  eq(result.labels[0], 0);
  eq(result.series[0].data[0], 0);
});

suite.test('BUG: animation duration=0 is preserved instead of falling back to the 300ms default', () => {
  const [animDef] = parseAnimationSource('opacity: 0 -> 1', 'animate', '@animate name="test" duration=0');
  eq(animDef.duration, 0);
});

suite.test('SECURITY: built-in component props (title, links, etc.) are escaped, not interpolated raw', () => {
  // None of the 12 built-in components (Card, HeroSection, ProfileCard,
  // etc.) escaped their props at all — a title containing a <script> tag,
  // or a ctaLink/avatar containing a javascript: URL, rendered and
  // executed as-is. Also affected: props used to build class names
  // (variant, trend, type), which could break out of the class attribute
  // entirely.
  const registry = new ComponentRegistry();
  const heroHtml = renderComponentNode({
    type: 'component_use', name: 'HeroSection', children: [],
    props: { title: '<script>alert(1)</script>', ctaText: 'Click', ctaLink: 'javascript:alert(1)' },
  }, {}, registry, null, 0);
  assert(!heroHtml.includes('<script>alert'), 'a <script> tag in a text prop must be escaped');
  assert(!heroHtml.includes('href="javascript:'), 'a javascript: URL in a link prop must be blocked');

  const cardHtml = renderComponentNode({
    type: 'component_use', name: 'Card', children: [],
    props: { title: 'Fine', variant: 'x"><img src=x onerror=alert(1)>' },
  }, {}, registry, null, 0);
  assert(!cardHtml.includes('<img src=x onerror'), 'a class-driving prop must not be able to break out of the attribute');

  // Legitimate content must still render correctly (no double-escaping).
  const normalHtml = renderComponentNode({
    type: 'component_use', name: 'HeroSection', children: [],
    props: { title: 'Fast & Simple' },
  }, {}, registry, null, 0);
  assert(normalHtml.includes('Fast &amp; Simple') && !normalHtml.includes('&amp;amp;'), 'an ampersand should be escaped exactly once, not double-escaped');
});

suite.test('SECURITY: user-defined @component prop interpolation is escaped, not raw', () => {
  // The same lack of escaping affected user-authored @component
  // definitions (interpolateText substituting {propName} placeholders in
  // a component's own body text) and macro expansion — both fixed by
  // making interpolateText escape substituted values by default.
  const registry = new ComponentRegistry();
  const src = `
component Card(title)
### {title}
slot
end

Card(title="<script>alert(1)</script>")
Safe slot body.
end
`;
  const { nodes } = parseComponent(src, { registry });
  const rendered = renderComponent(nodes[1], {}, registry);
  assert(!rendered.includes('<script>alert'), 'a <script> tag in a user-defined component prop must be escaped');
  assert(rendered.includes('Safe slot body'), 'slot content must still render correctly, unaffected by the escaping fix');
});

suite.test('SECURITY: macro parameter substitution is escaped, not raw', () => {
  const macroDef = { name: 'Greeting', params: ['name'], body: ['Hello, {name}!'] };
  const html = expandMacro(macroDef, ['<script>alert(1)</script>']);
  assert(!html.includes('<script>alert'), 'a <script> tag in a macro argument must be escaped');
});

suite.test('BUG: a bare `slot` marker with no fallback content no longer swallows the component/template\'s own closing `end`', () => {
  // `slot` (used as a plain placeholder, with no fallback content of its
  // own) would still consume the very next `end` keyword as though it
  // were closing the slot's fallback block — but that `end` almost
  // always belongs to the enclosing component/template definition. This
  // silently merged the next real usage of the component into the
  // definition's own body instead of parsing it as a separate node.
  const registry = new ComponentRegistry();
  const src = `
component Card(title)
### {title}
slot
end

Card(title="Hi")
Body text.
end
`;
  const { nodes } = parseComponent(src, { registry });
  eq(nodes.length, 2, 'the component definition and its usage must parse as two separate nodes');
  eq(nodes[1].type, 'component_use');
});

suite.test('BUG: @hint/@explain following @truefalse or @blank parsed as phantom quiz questions', () => {
  // Because @hint/@explain only tokenize as KW_HINT/KW_EXPLAIN (no PROP_*
  // form), and collectModsProps() only recognizes PROP_* tokens, a
  // trailing @hint/@explain after a single-line question type used to
  // fall through to the top-level dispatcher and get parsed as a
  // standalone "hint"/"explain" node — silently added to the quiz's
  // questions array, where quizScore() would count it as an extra,
  // always-unanswerable question and deflate the real score.
  const nodes = parseInteractiveSource(
    '@quiz "Q" {\n@truefalse "Earth is round"\nanswer true\n@hint "Think globally"\n@explain "Oblate spheroid"\n}'
  );
  eq(nodes[0].questions.length, 1, 'the hint/explain must attach to the true/false question, not become extra questions');
  eq(nodes[0].questions[0].hint, 'Think globally');
  eq(nodes[0].questions[0].explain, 'Oblate spheroid');
});

suite.test('BUG: @hint/@explain text kept literal surrounding quote characters', () => {
  // parseHintExplain() never called stripQuotes() on the captured text,
  // so every hint/explanation rendered with literal " marks baked in.
  const nodes = parseInteractiveSource(
    '@quiz "Q" {\n@mcq "Pick" {\n@correct "A"\n@choice "B"\n@hint "Think hard"\n@explain "A is correct"\n}\n}'
  );
  const mcq = nodes[0].questions[0];
  eq(mcq.hint, 'Think hard');
  eq(mcq.explain, 'A is correct');
});

suite.test('BUG: fill-blank @explain and casesensitive modifier were parsed but silently discarded', () => {
  const nodes = parseInteractiveSource(
    '@quiz "Q" {\n@blank "Capital of Japan"\nanswer "Tokyo"\ncasesensitive\n@explain "Capital since 1868"\n}'
  );
  const blank = nodes[0].questions[0];
  eq(blank.caseSensitive, true, 'casesensitive modifier must reach the AST node');
  eq(blank.explain, 'Capital since 1868');
});

suite.test('BUG: quiz rationale rendered unconditionally, revealing the answer before grading', () => {
  const { nodes } = parseInteractive('@quiz "Q" {\n@mcq "Pick" {\n@correct "A"\n@choice "B"\n@explain "Because A"\n}\n}');
  const html = renderInteractive(nodes);
  assert(html.includes('data-zl-explain'), 'explanation block must be marked for runtime-controlled reveal');
  assert(/data-zl-explain\s+hidden/.test(html), 'explanation must be hidden by default, not shown immediately');
});

suite.test('BUG: exported quiz runtime queried selectors the renderer never produces (Check Answers did nothing)', () => {
  // The embedded ZOLTO_RUNTIME_JS quiz handler looked for .zl-quiz-opt,
  // [data-quiz-submit] and .zl-quiz-feedback — none of which
  // src/interactive/renderer.js ever emits (.zl-option,
  // data-zl-quiz-submit, .zl-quiz-score). Clicking "Check Answers" on
  // any compiled/exported quiz was a silent no-op. Assert the runtime's
  // selectors now agree with what the renderer actually outputs.
  const { nodes } = parseInteractive('@quiz "Q" {\n@mcq "Pick" {\n@correct "A"\n@choice "B"\n}\n}');
  const html = renderInteractive(nodes);
  assert(html.includes('data-zl-quiz-submit'), 'renderer must emit a submit trigger the runtime can find');
  assert(html.includes('data-zl-quiz-score'), 'renderer must emit a score target the runtime can find');
  assert(html.includes('data-zl-correct'), 'renderer must mark correctness on each option input');

  assert(ZOLTO_RUNTIME_JS.includes('data-zl-quiz-submit'), 'runtime must query the selector the renderer actually emits for the submit button');
  assert(ZOLTO_RUNTIME_JS.includes('data-zl-quiz-score'), 'runtime must query the selector the renderer actually emits for the score element');
  assert(ZOLTO_RUNTIME_JS.includes('data-zl-correct'), 'runtime must read correctness off data-zl-correct, matching the renderer');
  assert(!ZOLTO_RUNTIME_JS.includes('zl-quiz-opt'), 'runtime must not reference the never-emitted .zl-quiz-opt class');
});

suite.test('BUG: exported flashcard-deck runtime queried classes the renderer never produces (nav did nothing)', () => {
  // Old runtime looked for .zl-flashcard-deck/.zl-flashcard/.zl-fc-prev/
  // .zl-fc-next/.zl-fc-counter and assumed every card was its own DOM
  // element. The real renderer (renderDeck) only ever puts ONE card
  // element in the DOM (.zl-deck > [data-zl-card]) and embeds the rest
  // as JSON in a <script data-zl-deck-data> tag — so even a correctly
  // selectored runtime that assumed one-DOM-element-per-card couldn't
  // have worked. Assert the real classes exist and the runtime parses
  // the JSON payload it needs to navigate at all.
  const { nodes } = parseInteractive('@deck "Capitals" {\n@card\nfront "France"\nback "Paris"\n@end\n@card\nfront "Japan"\nback "Tokyo"\n@end\n}');
  const html = renderInteractive(nodes);
  assert(html.includes('data-zl-deck-data'), 'renderer must embed the full card list as JSON for the runtime to read');
  assert(html.includes('data-zl-deck-prev') && html.includes('data-zl-deck-next'), 'renderer must emit the real nav button selectors');
  assert(html.includes('data-zl-deck-counter'), 'renderer must emit the real counter selector');

  assert(ZOLTO_RUNTIME_JS.includes('data-zl-deck-data'), 'runtime must read the embedded card JSON, not assume one element per card');
  assert(ZOLTO_RUNTIME_JS.includes('data-zl-deck-prev') && ZOLTO_RUNTIME_JS.includes('data-zl-deck-next'), 'runtime must query the selectors the renderer actually emits');
  assert(!ZOLTO_RUNTIME_JS.includes("querySelectorAll('.zl-flashcard-deck") && !ZOLTO_RUNTIME_JS.includes("querySelector('.zl-fc-prev"), 'runtime must not query the never-emitted .zl-flashcard-deck/.zl-fc-* classes');
});

suite.test('BUG: @itabs had zero interactivity anywhere; the exported runtime\'s "tabs" handler matched a different feature and fought its own working handler', () => {
  // .zl-tabs/.zl-tab-btn (the @tabs *directive*) already ships a
  // self-contained inline onclick handler that toggles panels via the
  // `hidden` attribute. The old runtime section also matched those same
  // class names and toggled `style.display`/`.active` instead — a second,
  // uncoordinated mechanism on the same elements — while the actually-
  // unwired feature, @itabs (.zl-itabs/.zl-itab-btn/.zl-itab-panel), was
  // never targeted by anything at all.
  assert(!ZOLTO_RUNTIME_JS.includes("querySelectorAll('.zl-tab-btn") && !ZOLTO_RUNTIME_JS.includes("querySelectorAll('.zl-tab-panel"), 'runtime must not duplicate the @tabs directive\'s own inline handler');
  assert(ZOLTO_RUNTIME_JS.includes('zl-itab-btn') && ZOLTO_RUNTIME_JS.includes('zl-itab-panel'), 'runtime must wire up the @itabs feature that actually has no handler of its own');
});

suite.test('BUG: poll "Vote" button was entirely unimplemented in the exported runtime', () => {
  const { nodes } = parseInteractive('@poll "Best editor?" {\nZolto\nOther\n}');
  const html = renderInteractive(nodes);
  assert(html.includes('data-zl-poll-submit'), 'renderer must emit a submit trigger');
  assert(html.includes('data-zl-poll-results'), 'renderer must emit a place to show results after voting');
  assert(ZOLTO_RUNTIME_JS.includes('data-zl-poll-submit'), 'runtime must actually wire up the vote button');
  assert(ZOLTO_RUNTIME_JS.includes('data-zl-poll-results'), 'runtime must populate the results container the renderer provides');
});

suite.test('BUG: quiz/flashcard/poll/@itabs interactivity only worked in the standalone export tool, never in the live editor app', () => {
  // index.html rendered preview.innerHTML = compile(src) and never called
  // any interactivity runtime at all — the runtime only existed embedded
  // inside src/export/js-bundle-export.js's exported bundles. Every
  // interactive feature was inert in the primary product surface. Assert
  // the live app now imports and invokes the same canonical runtime used
  // by exports.
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert(html.includes("from './src/interactive/runtime.js'"), 'index.html must import the canonical interactivity runtime');
  assert(html.includes('initZoltoInteractivity(preview)'), 'index.html must actually invoke it on the rendered preview');
});

suite.test('BUG: the export runtime was a hand-duplicated copy of the live-app runtime, free to drift out of sync', () => {
  // This is the root cause behind several bugs found and fixed in this
  // audit (quiz/flashcard/tabs selector mismatches): two independently
  // maintained copies of "the interactivity runtime" existed. Now
  // ZOLTO_RUNTIME_JS must be *derived* from the one real, importable,
  // testable function via Function.prototype.toString(), not restated.
  eq(ZOLTO_RUNTIME_JS, initZoltoInteractivity.toString(), 'the exported runtime string must be produced from the canonical function, not a separate hand-written copy');
});

suite.test('BUG: any directive title/question containing a literal "{" was silently truncated and corrupted', () => {
  // Every directive that captures a quoted title/question (@mcq, @quiz,
  // @form, @select, @poll, @deck, @radio, @segment, @matching, @matrix)
  // stripped the trailing block-opening `{` with a non-quote-aware regex
  // like `.replace(/\s*\{.*/, '')`. It cut at the FIRST `{` anywhere in
  // the string — including one legitimately inside the quoted text —
  // and then a subsequent `.slice(1, -1)` (assuming the last character
  // was the closing quote) chopped off a real trailing character too,
  // since the genuine closing quote had already been deleted.
  const mcq = parseInteractiveSource('@mcq "Your score is {score} out of 10" {\n@correct "A"\n@choice "B"\n}')[0];
  eq(mcq.question, 'Your score is {score} out of 10');

  const quiz = parseInteractiveSource('@quiz "Math {formula} test" {\n@mcq "Q" {\n@correct "A"\n@choice "B"\n}\n}')[0];
  eq(quiz.title, 'Math {formula} test');

  const poll = parseInteractiveSource('@poll "How {many} do you like?" {\nA\nB\n}')[0];
  eq(poll.question, 'How {many} do you like?');
});

suite.test('BUG: @select falsely detected the "multi" modifier from titles merely containing the word "multiple"', () => {
  // `const multi = /multi/i.test(rawVal)` tested the ENTIRE raw captured
  // value, including inside the quoted label — so a select titled
  // "Choose your multiple items" was incorrectly flagged multi:true even
  // though the actual `multi` modifier keyword was never written.
  const falsePositive = parseInteractiveSource('@select "Choose your multiple items" {\n@option "A"\n}')[0];
  eq(falsePositive.multi, false, 'a title merely containing the word "multiple" must not enable multi-select');

  const realMulti = parseInteractiveSource('@select "Pick" multi searchable {\n@option "A"\n}')[0];
  eq(realMulti.multi, true);
  eq(realMulti.searchable, true);
  eq(realMulti.name, '"Pick"');
});

suite.test('BUG: component array/object prop literals broke on commas inside quoted values', () => {
  // parseLiteralValue() used a plain `.split(',')` on the inside of
  // `[...]`/`{...}` literals — any comma inside a quoted string value
  // was treated as a list separator. `["a,b", "c"]` split into three
  // broken fragments instead of two clean elements, and
  // `{name="Smith, John", age=30}` lost the `name` key entirely,
  // producing two garbage keys from the two halves of the split string.
  eq(JSON.stringify(parseLiteralValue('["a,b", "c"]')), JSON.stringify(['a,b', 'c']));
  eq(JSON.stringify(parseLiteralValue('{name="Smith, John", age=30}')), JSON.stringify({ name: 'Smith, John', age: 30 }));
});

suite.test('BUG: component object prop values containing "=" were silently truncated', () => {
  // `p.split('=').map(x => x.trim())` destructured into exactly two
  // parts — a value like a URL query string containing its own `=`
  // signs lost everything after the second `=`.
  eq(JSON.stringify(parseLiteralValue('{url="http://x.com?a=b"}')), JSON.stringify({ url: 'http://x.com?a=b' }));
});

export default suite;
