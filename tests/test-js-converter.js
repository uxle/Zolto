/**
 * Integration suite for Zolto .zl to .js Standalone Bundle Converter
 */
import { createSuite, assert, eq } from './runner.js';
import { generateJsBundle, ZOLTO_EMBEDDED_CSS, ZOLTO_RUNTIME_JS } from '../src/export/js-bundle-export.js';

const suite = createSuite('Integration · .zl to .js Standalone Converter');

suite.test('generates universal UMD bundle with ZoltoDocument global and interactivity', () => {
  const zl = `# Document Title\n\n> [!NOTE]\n> A callout note\n\n\`\`\`js\nconst a = 10;\n\`\`\``;
  const bundle = generateJsBundle(zl, { format: 'universal' });

  assert(typeof bundle.js === 'string' && bundle.js.length > 0, 'generates non-empty JS bundle');
  assert(bundle.js.includes('ZoltoDocument'), 'universal format defines ZoltoDocument');
  assert(bundle.js.includes('initZoltoInteractivity'), 'includes interactive JS runtime');
  assert(bundle.js.includes('zl-doc-container'), 'includes document container wrapper');
  assert(bundle.js.includes('zl-callout'), 'includes compiled callout in HTML payload');
});

suite.test('generates Custom Web Component bundle with Shadow DOM encapsulation', () => {
  const zl = `## Web Component Test\n\n- item 1\n- item 2`;
  const bundle = generateJsBundle(zl, { format: 'webcomponent' });

  assert(bundle.js.includes('customElements.define'), 'defines custom element');
  assert(bundle.js.includes('zolto-document'), 'registers zolto-document tag');
  assert(bundle.js.includes('attachShadow'), 'uses Shadow DOM');
});

suite.test('generates self-mounting IIFE widget', () => {
  const zl = `# IIFE Widget\n\n@card\nCard content\n@/card`;
  const bundle = generateJsBundle(zl, { format: 'iife', targetSelector: '#my-app' });

  assert(bundle.js.includes('#my-app'), 'IIFE mounts into target selector');
  assert(bundle.js.includes('DOMContentLoaded'), 'handles DOMContentLoaded lifecycle');
});

suite.test('generates clean ES Module bundle exporting html, css, and mount', () => {
  const zl = `# ES Module Export`;
  const bundle = generateJsBundle(zl, { format: 'esm' });

  assert(bundle.js.includes('export const html ='), 'exports named html constant');
  assert(bundle.js.includes('export const css ='), 'exports named css constant');
  assert(bundle.js.includes('export function mount'), 'exports mount function');
  assert(bundle.js.includes('export default'), 'exports default module object');
});

suite.test('includes complete standalone CSS design tokens and component rules', () => {
  assert(ZOLTO_EMBEDDED_CSS.includes('--zl-primary'), 'embedded CSS includes design tokens');
  assert(ZOLTO_EMBEDDED_CSS.includes('.zl-callout'), 'embedded CSS includes callout rules');
  assert(ZOLTO_EMBEDDED_CSS.includes('.zl-cb'), 'embedded CSS includes code block styling');
  assert(ZOLTO_EMBEDDED_CSS.includes('.zl-quiz'), 'embedded CSS includes quiz styling');
  assert(ZOLTO_EMBEDDED_CSS.includes('.zl-flashcard'), 'embedded CSS includes flashcard styling');
});

suite.test('compiles interactive educational features (quizzes, flashcard decks)', () => {
  const zl = `---
title: Interactive Test
---

@quiz "CS Basics" {
  @mcq "What is 2+2?" {
    @correct "4"
    @choice "5"
  }
}
@/quiz

@deck Algorithms {
  @card
    front "Binary Search"
    back "O(log n) search on sorted arrays"
  @end
}
@/deck
`;

  const bundle = generateJsBundle(zl);
  assert(bundle.html.includes('quiz') || bundle.html.includes('mcq'), 'compiled payload includes quiz markup');
  assert(bundle.html.includes('deck') || bundle.html.includes('card'), 'compiled payload includes flashcard/deck markup');
  assert(bundle.metadata.nodeCount > 0, 'metadata contains nodeCount');
});

export default suite;
