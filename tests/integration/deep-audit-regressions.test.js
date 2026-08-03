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
import { parseComponent, renderComponent } from '../../src/zolto.js';

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

export default suite;
