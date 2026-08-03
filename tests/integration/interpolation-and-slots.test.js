/**
 * Integration tests for text interpolation and the component/slot system.
 *
 * These replace three orphaned scripts that lived at the repo root
 * (test-interpolate.js, test-interpolate2.js, test-slot.js) — none of
 * them were wired into the actual test harness, and one of them
 * (test-slot.js) threw a ReferenceError immediately on execution due to
 * missing imports, meaning it had never actually been run successfully.
 */
import { createSuite, assert, eq } from '../runner.js';
import { interpolateText } from '../../src/component/props.js';
import { parseComponent, renderComponent, ComponentRegistry } from '../../src/zolto.js';

const suite = createSuite('Integration · Interpolation & Component Slots');

suite.test('interpolateText leaves non-template braces untouched', () => {
  eq(interpolateText('body { color: red; }'), 'body { color: red; }');
  eq(interpolateText('let obj = {a: 1, b: 2};'), 'let obj = {a: 1, b: 2};');
});

suite.test('interpolateText substitutes a simple named variable', () => {
  eq(interpolateText('Hello {name}!', { name: 'Zolto' }), 'Hello Zolto!');
});

suite.test('interpolateText substitutes a dotted path variable', () => {
  eq(interpolateText('User { user.name }', { user: { name: 'Alice' } }), 'User Alice');
});

suite.test('interpolateText leaves an invalid identifier untouched', () => {
  const result = interpolateText('Invalid { 123 }', {});
  assert(result.includes('{ 123 }'), 'a non-identifier expression should not be treated as a variable reference');
});

suite.test('component definitions render with slot content substituted', () => {
  const registry = new ComponentRegistry();
  const src = `
component Card(title, subtitle="", variant="default")
card variant=variant
### {title}
{subtitle}
slot
end
end

Card(title="Welcome", subtitle="Hello World", variant="primary")
This is the body.
end
`;
  const { nodes } = parseComponent(src, { registry });
  const rendered = renderComponent(nodes[1], {}, registry);
  assert(rendered.includes('Welcome'), 'rendered output should include the title prop');
  assert(rendered.includes('Hello World'), 'rendered output should include the subtitle prop');
  assert(rendered.includes('This is the body'), 'rendered output should include the slot content');
});

export default suite;
