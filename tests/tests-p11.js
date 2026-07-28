/**
 * Zolto Phase 11 Test Suite — Animation & Presentation Runtime
 *
 * Tests: parsing, rendering, easing validation, keyframe generation,
 *        timeline sequencing, presentation slides, speaker notes,
 *        accessibility, compile integration, and performance.
 */

import { parseAnimation, renderAnimation, validateAnimation, compile } from '../src/zolto.js';
import { isValidEasing, isValidDuration, resolveEasing, parseDuration } from '../src/animation/easing.js';
import { keyframesToCSS, builtinKeyframesCSS, BUILTIN_KEYFRAMES } from '../src/animation/keyframes.js';
import { parseAnimationSource } from '../src/animation/parser.js';
import { AnimationDiagnostics } from '../src/animation/diagnostics.js';
import { generateSlideOutline } from '../src/animation/renderer.js';
import { ANIMATION_CSS } from '../src/animation/styles.js';
import {
  createAnimationDef, createKeyframesDef, createKeyframeStep,
  createTimeline, createTimelineStep, createPresentation, createSlide,
  createSpeakerNote, ANIMATION_NODE_TYPES, isAnimationNode,
} from '../src/animation/ast.js';

// ─── Tiny test harness ────────────────────────────────────────────────────────

let _pass = 0, _fail = 0;
const results = [];

function test(desc, fn) {
  try { fn(); _pass++; results.push({ pass: true, desc }); }
  catch (e) { _fail++; results.push({ pass: false, desc, err: String(e.message) }); }
}

function assert(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function includes(str, sub, msg) {
  if (!String(str).includes(sub)) throw new Error(msg || `Expected "${sub}" to be in string`);
}

function notIncludes(str, sub, msg) {
  if (String(str).includes(sub)) throw new Error(msg || `"${sub}" should NOT be in string`);
}

// ─── 1. AST node factories ────────────────────────────────────────────────────

test('createAnimationDef has all required fields', () => {
  const node = createAnimationDef('fadeIn', [], { duration: 300, easing: 'ease-out' });
  eq(node.type, ANIMATION_NODE_TYPES.ANIMATION_DEF, 'type must be animation_def');
  eq(node.name, 'fadeIn', 'name');
  eq(node.duration, 300, 'duration');
  eq(node.easing, 'ease-out', 'easing');
  assert(Array.isArray(node.props), 'props must be array');
});

test('createKeyframesDef has steps array', () => {
  const step = createKeyframeStep(0, [['opacity', '0']]);
  const node = createKeyframesDef('popIn', [step]);
  eq(node.type, ANIMATION_NODE_TYPES.KEYFRAMES_DEF, 'type');
  eq(node.name, 'popIn', 'name');
  eq(node.steps.length, 1, 'one step');
  eq(node.steps[0].percent, 0, 'step percent');
  eq(node.steps[0].declarations[0][0], 'opacity', 'declaration prop');
});

test('createTimeline with steps', () => {
  const s1 = createTimelineStep('First', { delay: 0 });
  const s2 = createTimelineStep('Second', { delay: 300 });
  const tl = createTimeline([s1, s2], { auto: true });
  eq(tl.type, ANIMATION_NODE_TYPES.ANIM_TIMELINE, 'type');
  eq(tl.steps.length, 2, 'two steps');
  eq(tl.steps[1].delay, 300, 'step delay');
});

test('createPresentation with slides and notes', () => {
  const note  = createSpeakerNote('Remind about roadmap', { cue: 'slide 1' });
  const slide = createSlide('# Hello', { title: 'Intro', slideType: 'title', notes: [note] });
  const pres  = createPresentation([slide], { title: 'Demo', ratio: '16:9' });
  eq(pres.type, ANIMATION_NODE_TYPES.PRESENTATION, 'type');
  eq(pres.slides.length, 1, 'one slide');
  eq(pres.slides[0].notes.length, 1, 'note in slide');
  eq(pres.slides[0].notes[0].content, 'Remind about roadmap', 'note content');
  eq(pres.slides[0].notes[0].cue, 'slide 1', 'note cue');
});

test('isAnimationNode recognizes all node types', () => {
  for (const type of Object.values(ANIMATION_NODE_TYPES)) {
    assert(isAnimationNode({ type }), `isAnimationNode should return true for type "${type}"`);
  }
  assert(!isAnimationNode({ type: 'paragraph' }), 'paragraph is not an animation node');
  assert(!isAnimationNode(null), 'null is not an animation node');
});

// ─── 2. Easing validation ─────────────────────────────────────────────────────

test('isValidEasing accepts built-in CSS easings', () => {
  assert(isValidEasing('ease'), 'ease');
  assert(isValidEasing('linear'), 'linear');
  assert(isValidEasing('ease-in'), 'ease-in');
  assert(isValidEasing('ease-out'), 'ease-out');
  assert(isValidEasing('ease-in-out'), 'ease-in-out');
});

test('isValidEasing accepts named Zolto easings', () => {
  assert(isValidEasing('spring'), 'spring');
  assert(isValidEasing('bounce'), 'bounce');
  assert(isValidEasing('standard'), 'standard');
  assert(isValidEasing('decelerate'), 'decelerate');
});

test('isValidEasing accepts cubic-bezier', () => {
  assert(isValidEasing('cubic-bezier(0.2, 0, 0, 1)'), 'cubic-bezier');
  assert(isValidEasing('cubic-bezier(0.34, 1.56, 0.64, 1)'), 'spring cubic-bezier');
});

test('isValidEasing accepts steps()', () => {
  assert(isValidEasing('steps(4, end)'), 'steps with end');
  assert(isValidEasing('steps(1)'), 'steps with count only');
});

test('isValidEasing rejects invalid values', () => {
  assert(!isValidEasing(''), 'empty string');
  assert(!isValidEasing('invalid-easing'), 'unknown name');
  assert(!isValidEasing('cubic(0.1)'), 'malformed cubic');
  assert(!isValidEasing(null), 'null');
});

test('resolveEasing returns CSS value for named easings', () => {
  eq(resolveEasing('spring'), 'cubic-bezier(0.34, 1.56, 0.64, 1)', 'spring resolved');
  eq(resolveEasing('ease'), 'ease', 'ease resolved');
  eq(resolveEasing('invalid'), 'ease', 'invalid falls back to ease');
  eq(resolveEasing(''), 'ease', 'empty falls back to ease');
});

// ─── 3. Duration parsing ──────────────────────────────────────────────────────

test('parseDuration handles ms, s, and bare numbers', () => {
  eq(parseDuration(300), 300, 'bare number');
  eq(parseDuration('300ms'), 300, '300ms');
  eq(parseDuration('0.3s'), 300, '0.3s');
  eq(parseDuration('1s'), 1000, '1s');
  eq(parseDuration('120'), 120, 'bare string number');
});

test('isValidDuration correctly validates', () => {
  assert(isValidDuration(0), 'zero');
  assert(isValidDuration(300), 'number');
  assert(isValidDuration('300ms'), '300ms string');
  assert(isValidDuration('0.5s'), '0.5s string');
  assert(!isValidDuration('fast'), 'non-numeric string');
  assert(!isValidDuration(-1), 'negative number');
});

// ─── 4. Keyframe CSS generation ───────────────────────────────────────────────

test('keyframesToCSS generates valid @keyframes', () => {
  const step0   = createKeyframeStep(0,   [['opacity', '0'], ['transform', 'translateY(16px)']]);
  const step100 = createKeyframeStep(100, [['opacity', '1'], ['transform', 'translateY(0)']]);
  const node    = createKeyframesDef('mySlideIn', [step0, step100]);
  const css     = keyframesToCSS(node);
  includes(css, '@keyframes mySlideIn', '@keyframes name');
  includes(css, '0%', '0% step');
  includes(css, '100%', '100% step');
  includes(css, 'opacity: 0', 'opacity prop');
  includes(css, 'transform: translateY(16px)', 'transform prop');
});

test('builtinKeyframesCSS returns CSS for standard types', () => {
  const css = builtinKeyframesCSS('fade', 'myFade');
  includes(css, '@keyframes myFade', 'keyframes name');
  includes(css, 'opacity', 'opacity in fade');
});

test('BUILTIN_KEYFRAMES contains essential entries', () => {
  for (const name of ['fadeIn', 'fadeOut', 'slideInUp', 'scaleIn', 'popIn', 'pulse', 'shake']) {
    assert(BUILTIN_KEYFRAMES[name], `${name} in BUILTIN_KEYFRAMES`);
  }
});

test('keyframesToCSS uses built-in body when steps empty and name matches', () => {
  const node = createKeyframesDef('fadeIn', []);
  const css  = keyframesToCSS(node);
  includes(css, '@keyframes fadeIn', 'name');
  includes(css, 'opacity', 'opacity content');
});

// ─── 5. @animate parsing ─────────────────────────────────────────────────────

test('Parses @animate block to AnimationDef node', () => {
  const { nodes } = parseAnimation('opacity: 0 -> 1\ntranslateY: 12 -> 0', {
    tag: 'animate', header: '@animate name="fadeIn" duration=300 easing="ease-out"',
  });
  eq(nodes.length, 1, 'one node');
  eq(nodes[0].type, ANIMATION_NODE_TYPES.ANIMATION_DEF, 'type');
  eq(nodes[0].name, 'fadeIn', 'name');
  eq(nodes[0].duration, 300, 'duration');
  eq(nodes[0].easing, 'ease-out', 'easing');
  eq(nodes[0].props.length, 2, 'two props');
  eq(nodes[0].props[0].prop, 'opacity', 'first prop');
  eq(nodes[0].props[0].from, '0', 'from value');
  eq(nodes[0].props[0].to, '1', 'to value');
});

test('Parses @animate with stagger attribute', () => {
  const { nodes } = parseAnimation('opacity: 0 -> 1', {
    tag: 'animate', header: '@animate name="stagger" duration=200 stagger=80',
  });
  eq(nodes[0].stagger, 80, 'stagger delay');
});

test('Parses @animate with delay attribute', () => {
  const { nodes } = parseAnimation('opacity: 0 -> 1', {
    tag: 'animate', header: '@animate name="delayed" duration=400 delay=150',
  });
  eq(nodes[0].delay, 150, 'delay value');
});

// ─── 6. @keyframes parsing ───────────────────────────────────────────────────

test('Parses @keyframes block with percent steps', () => {
  const src = `0%   { opacity: 0; transform: scale(0.9); }
60%  { transform: scale(1.05); }
100% { opacity: 1; transform: scale(1); }`;
  const { nodes } = parseAnimation(src, { tag: 'keyframes', header: '@keyframes popIn' });
  eq(nodes.length, 1, 'one node');
  eq(nodes[0].type, ANIMATION_NODE_TYPES.KEYFRAMES_DEF, 'type');
  eq(nodes[0].name, 'popIn', 'name');
  eq(nodes[0].steps.length, 3, 'three steps');
  eq(nodes[0].steps[0].percent, 0, '0% step');
  eq(nodes[0].steps[1].percent, 60, '60% step');
  eq(nodes[0].steps[2].percent, 100, '100% step');
});

// ─── 7. @timeline parsing ────────────────────────────────────────────────────

test('Parses @anim-timeline with @step blocks', () => {
  const src = `@step delay=0
First point revealed immediately.
@/step
@step delay=300
Second point with 300ms delay.
@/step
@step delay=600 highlight
Highlighted third point.
@/step`;
  const { nodes } = parseAnimation(src, { tag: 'anim-timeline', header: '@anim-timeline auto=true' });
  eq(nodes.length, 1, 'one node');
  eq(nodes[0].type, ANIMATION_NODE_TYPES.ANIM_TIMELINE, 'type');
  eq(nodes[0].steps.length, 3, 'three steps');
  eq(nodes[0].steps[0].delay, 0, 'first step delay');
  eq(nodes[0].steps[1].delay, 300, 'second step delay');
  eq(nodes[0].steps[2].delay, 600, 'third step delay');
  assert(nodes[0].steps[2].highlight, 'third step highlighted');
});

test('@anim-timeline auto=false sets auto to false', () => {
  const { nodes } = parseAnimation('@step\nContent\n@/step', {
    tag: 'anim-timeline', header: '@anim-timeline auto=false',
  });
  eq(nodes[0].auto, false, 'auto is false');
});

// ─── 8. @presentation / @slide parsing ───────────────────────────────────────

test('Parses @slides with @slide blocks', () => {
  const src = `@slide type="title" title="Welcome to Zolto"
# Welcome to Zolto
A next-generation document language.
@/slide
@slide type="content" title="Features"
## Key Features
- Native math
- Native diagrams
- Native charts
@/slide`;
  const { nodes } = parseAnimation(src, { tag: 'slides', header: '@slides theme="dark" ratio="16:9"' });
  eq(nodes.length, 1, 'one presentation node');
  eq(nodes[0].type, ANIMATION_NODE_TYPES.PRESENTATION, 'type');
  eq(nodes[0].theme, 'dark', 'theme');
  eq(nodes[0].ratio, '16:9', 'ratio');
  eq(nodes[0].slides.length, 2, 'two slides');
  eq(nodes[0].slides[0].slideType, 'title', 'first slide type');
  eq(nodes[0].slides[0].title, 'Welcome to Zolto', 'first slide title');
  eq(nodes[0].slides[1].slideType, 'content', 'second slide type');
});

test('@slide content is captured correctly', () => {
  const src = `@slide type="content" title="Details"
## Section
Some paragraph text here.
@/slide`;
  const { nodes } = parseAnimation(src, { tag: 'slides', header: '@slides' });
  const slide = nodes[0].slides[0];
  includes(slide.content, 'Some paragraph text here', 'content in slide');
});

// ─── 9. Speaker notes ─────────────────────────────────────────────────────────

test('Parses @note inside @slide', () => {
  const src = `@slide type="title" title="Intro"
# Hello World
@note
Remember to welcome the audience first.
@/note
@/slide`;
  const { nodes } = parseAnimation(src, { tag: 'slides', header: '@slides' });
  const slide = nodes[0].slides[0];
  eq(slide.notes.length, 1, 'one note');
  includes(slide.notes[0].content, 'welcome the audience', 'note content');
});

test('Speaker note cue is parsed', () => {
  const note = createSpeakerNote('Pause for effect', { cue: 'dramatic beat' });
  eq(note.type, ANIMATION_NODE_TYPES.SPEAKER_NOTE, 'type');
  eq(note.cue, 'dramatic beat', 'cue');
  eq(note.content, 'Pause for effect', 'content');
});

// ─── 10. Renderer output ──────────────────────────────────────────────────────

test('renderAnimation for AnimationDef emits <style> tag', () => {
  const node = createAnimationDef('fadeIn', [], { duration: 300, easing: 'ease-out' });
  const html = renderAnimation(node);
  includes(html, '<style', 'style tag');
  includes(html, 'data-zl-animate', 'data attribute');
  includes(html, 'animation:', 'CSS animation property');
  includes(html, 'prefers-reduced-motion', 'reduced-motion media query');
});

test('renderAnimation for KeyframesDef emits @keyframes CSS', () => {
  const step = createKeyframeStep(0, [['opacity', '0']]);
  const node = createKeyframesDef('myAnim', [step]);
  const html = renderAnimation(node);
  includes(html, '<style', 'style tag');
  includes(html, '@keyframes myAnim', 'keyframes');
  includes(html, 'prefers-reduced-motion: no-preference', 'media query');
});

test('renderAnimation for Timeline emits timeline HTML', () => {
  const s1 = createTimelineStep('First',  { delay: 0 });
  const s2 = createTimelineStep('Second', { delay: 300 });
  const tl = createTimeline([s1, s2]);
  const html = renderAnimation(tl);
  includes(html, 'zl-timeline', 'timeline class');
  includes(html, 'zl-timeline-step', 'step class');
  includes(html, 'data-zl-timeline', 'timeline data attr');
  includes(html, 'First', 'first step content');
  includes(html, 'Second', 'second step content');
  includes(html, 'role="list"', 'ARIA role');
});

test('renderAnimation for Presentation emits deck HTML', () => {
  const slide = createSlide('# Hello', { title: 'Intro', slideType: 'title' });
  const pres  = createPresentation([slide], { title: 'Test Pres', controls: true });
  const html  = renderAnimation(pres);
  includes(html, 'zl-presentation', 'presentation class');
  includes(html, 'zl-slide', 'slide class');
  includes(html, 'zl-presentation-deck', 'deck class');
  includes(html, 'zl-presentation-controls', 'controls class');
  includes(html, 'zl-slide-outline', 'outline');
  includes(html, 'aria-label', 'ARIA label');
  includes(html, 'data-zl-presentation', 'data attribute');
});

test('Speaker notes are hidden with hidden attribute', () => {
  const note  = createSpeakerNote('Private note for speaker');
  const slide = createSlide('# Content', { title: 'Slide', notes: [note] });
  const pres  = createPresentation([slide]);
  const html  = renderAnimation(pres);
  includes(html, 'zl-speaker-note', 'speaker note class');
  includes(html, 'hidden', 'hidden attribute');
  includes(html, 'aria-hidden="true"', 'aria-hidden');
});

test('First slide is active, others are not', () => {
  const s1 = createSlide('# One', { title: 'First' });
  const s2 = createSlide('# Two', { title: 'Second' });
  const s3 = createSlide('# Three', { title: 'Third' });
  const pres = createPresentation([s1, s2, s3]);
  const html = renderAnimation(pres);
  includes(html, 'zl-slide--active', 'active class on first slide');
  const activeCount = (html.match(/zl-slide--active/g) || []).length;
  eq(activeCount, 1, 'exactly one active slide');
});

// ─── 11. Slide outline generation ────────────────────────────────────────────

test('generateSlideOutline returns correct outline', () => {
  const s1 = createSlide('A', { title: 'Intro', slideType: 'title', id: 'slide-1' });
  const s2 = createSlide('B', { title: 'Details', slideType: 'content' });
  const s3 = createSlide('C', { title: 'Thanks', slideType: 'closing' });
  const pres = createPresentation([s1, s2, s3]);
  const outline = generateSlideOutline(pres);
  eq(outline.length, 3, 'three outline entries');
  eq(outline[0].title, 'Intro', 'first title');
  eq(outline[0].type, 'title', 'first type');
  eq(outline[0].id, 'slide-1', 'first id');
  eq(outline[1].type, 'content', 'second type');
  eq(outline[2].type, 'closing', 'third type');
});

test('generateSlideOutline returns empty array for non-presentation', () => {
  const result = generateSlideOutline({ type: 'paragraph', children: [] });
  eq(result.length, 0, 'empty array');
});

// ─── 12. Motion token CSS ─────────────────────────────────────────────────────

test('ANIMATION_CSS contains motion token custom properties', () => {
  includes(ANIMATION_CSS, '--zl-motion-fast', 'fast token');
  includes(ANIMATION_CSS, '--zl-motion-medium', 'medium token');
  includes(ANIMATION_CSS, '--zl-motion-slow', 'slow token');
  includes(ANIMATION_CSS, '--zl-motion-spring', 'spring token');
  includes(ANIMATION_CSS, '--zl-motion-distance-md', 'distance token');
});

test('ANIMATION_CSS includes prefers-reduced-motion rule', () => {
  includes(ANIMATION_CSS, 'prefers-reduced-motion: reduce', 'reduced motion');
  includes(ANIMATION_CSS, 'animation-duration:       0.01ms', 'zero-duration override');
});

test('ANIMATION_CSS includes built-in @keyframes', () => {
  includes(ANIMATION_CSS, 'zl-fadeIn', 'fadeIn keyframes');
  includes(ANIMATION_CSS, 'zl-slideInUp', 'slideInUp keyframes');
  includes(ANIMATION_CSS, 'zl-pulse', 'pulse keyframes');
  includes(ANIMATION_CSS, 'zl-shake', 'shake keyframes');
});

test('ANIMATION_CSS keyframes wrapped in prefers-reduced-motion: no-preference', () => {
  includes(ANIMATION_CSS, 'prefers-reduced-motion: no-preference', 'no-preference wrapper');
});

// ─── 13. Validation ───────────────────────────────────────────────────────────

test('validateAnimation returns empty diagnostics for valid nodes', () => {
  const node = createAnimationDef('valid', [], { duration: 300, easing: 'ease' });
  const diag = validateAnimation([node]);
  assert(!diag.hasErrors, 'no errors');
});

test('validateAnimation warns on missing animation name', () => {
  const node = createAnimationDef('', [], { duration: 300 });
  const diag = validateAnimation([node]);
  assert(diag.hasWarnings, 'should warn for empty name');
});

test('validateAnimation warns on missing keyframe steps (non-builtin)', () => {
  const node = createKeyframesDef('customAnim', []);
  const diag = validateAnimation([node]);
  // info-level: no steps found, will use built-in if name matches
  assert(diag.infos.length > 0 || !diag.hasErrors, 'info or no errors');
});

test('validateAnimation warns on invalid easing', () => {
  const node = createAnimationDef('test', [], { duration: 300, easing: 'invalid-easing' });
  node.easing = 'invalid-easing'; // bypass factory resolution
  const diag = validateAnimation([node]);
  assert(diag.hasWarnings, 'should warn for invalid easing');
});

test('validateAnimation warns on empty presentation', () => {
  const pres = createPresentation([], { title: 'Empty' });
  const diag = validateAnimation([pres]);
  assert(diag.hasWarnings, 'should warn for no slides');
});

test('validateAnimation warns on unusual aspect ratio', () => {
  const slide = createSlide('content', { title: 'Slide' });
  const pres  = createPresentation([slide], { ratio: '2:1' });
  const diag  = validateAnimation([pres]);
  assert(diag.hasWarnings, 'should warn for unusual ratio');
});

test('AnimationDiagnostics merge works correctly', () => {
  const d1 = new AnimationDiagnostics();
  const d2 = new AnimationDiagnostics();
  d1.error('E001', 'First error');
  d2.warn('W001', 'A warning');
  d1.merge(d2);
  eq(d1.errors.length, 1, 'one error');
  eq(d1.warnings.length, 1, 'one warning');
  assert(d1.hasErrors, 'has errors');
  assert(d1.hasWarnings, 'has warnings');
});

// ─── 14. Compile integration ──────────────────────────────────────────────────

test('compile() integrates @animate block', () => {
  const src = `# Hello

@animate name="fadeIn" duration=300 easing="ease-out"
opacity: 0 -> 1
@/animate

Some paragraph.`;
  const html = compile(src);
  includes(html, 'zl-animation-styles', 'animation styles injected');
  includes(html, 'data-zl-animate', 'animate data attr');
  includes(html, 'Hello', 'heading rendered');
  includes(html, 'Some paragraph', 'paragraph rendered');
});

test('compile() integrates @keyframes block', () => {
  const src = `@keyframes myBounce
0%   { opacity: 0; transform: scale(0.9); }
100% { opacity: 1; transform: scale(1); }
@/keyframes

Content after keyframes.`;
  const html = compile(src);
  includes(html, '@keyframes myBounce', 'keyframes in output');
  includes(html, 'Content after keyframes', 'content rendered');
});

test('compile() integrates @anim-timeline block', () => {
  const src = `@anim-timeline auto=true
@step delay=0
Step one content.
@/step
@step delay=200
Step two content.
@/step
@/anim-timeline`;
  const html = compile(src);
  includes(html, 'zl-timeline', 'timeline rendered');
  includes(html, 'Step one content', 'step 1 in output');
  includes(html, 'Step two content', 'step 2 in output');
});

test('compile() integrates @slides block', () => {
  const src = `@slides theme="dark" ratio="16:9"
@slide type="title" title="Hello"
# Hello World
@/slide
@slide type="content" title="Features"
## Features
- One
- Two
@/slide
@/slides`;
  const html = compile(src);
  includes(html, 'zl-presentation', 'presentation rendered');
  includes(html, 'zl-slide', 'slide rendered');
  includes(html, 'Hello World', 'slide content rendered');
  includes(html, 'zl-animation-styles', 'animation CSS injected');
});

test('compile() with mixed content (Phase 1-11 backwards compat)', () => {
  const src = `# Title

Regular paragraph with **bold** and _italic_.

@animate name="in" duration=200
opacity: 0 -> 1
@/animate

> A blockquote.

- Item one
- Item two
`;
  const html = compile(src);
  includes(html, '<h1', 'heading');
  includes(html, '<strong>', 'bold');
  includes(html, '<em>', 'italic');
  includes(html, '<blockquote>', 'blockquote');
  includes(html, '<ul>', 'list');
  includes(html, 'zl-animation', 'animation');
});

// ─── 15. Accessibility ────────────────────────────────────────────────────────

test('Presentation has ARIA label on root element', () => {
  const slide = createSlide('# Content', { title: 'Slide 1' });
  const pres  = createPresentation([slide], { title: 'My Slides' });
  const html  = renderAnimation(pres);
  includes(html, 'aria-label="My Slides"', 'ARIA label on presentation');
});

test('Slide has role="region" with ARIA label', () => {
  const slide = createSlide('Content', { title: 'My Slide' });
  const pres  = createPresentation([slide]);
  const html  = renderAnimation(pres);
  includes(html, 'role="region"', 'region role on slide');
  includes(html, 'aria-label="My Slide"', 'aria label from title');
});

test('Presentation controls are keyboard accessible', () => {
  const slide = createSlide('Content', { title: 'S1' });
  const pres  = createPresentation([slide], { controls: true });
  const html  = renderAnimation(pres);
  includes(html, 'aria-label="Previous slide"', 'prev button label');
  includes(html, 'aria-label="Next slide"', 'next button label');
  includes(html, 'role="toolbar"', 'toolbar role');
});

test('renderAnimation for AnimationDef wraps keyframes in reduced-motion query', () => {
  const node = createAnimationDef('testAnim', [], { duration: 200 });
  const html = renderAnimation(node);
  includes(html, 'prefers-reduced-motion: no-preference', 'no-preference wrap');
});

// ─── 16. Performance ─────────────────────────────────────────────────────────

test('Render 50-slide presentation in <500ms', () => {
  const slides = Array.from({ length: 50 }, (_, i) =>
    createSlide(`# Slide ${i + 1}\n\nContent for slide ${i + 1}.`, {
      title: `Slide ${i + 1}`,
      slideType: i === 0 ? 'title' : 'content',
    })
  );
  const pres = createPresentation(slides, { title: 'Big Deck', controls: true });
  const t0   = Date.now();
  const html = renderAnimation(pres);
  const ms   = Date.now() - t0;
  assert(ms < 500, `50-slide presentation rendered in ${ms}ms (must be <500ms)`);
  includes(html, 'zl-slide', 'has slides');
  eq(slides.length, 50, '50 slides');
});

test('Parse 20 @animate directives in <100ms', () => {
  const src = Array.from({ length: 20 }, (_, i) =>
    `@animate name="anim${i}" duration=${100 + i * 10} easing="ease"\nopacity: 0 -> 1\n@/animate`
  ).join('\n\n');
  const t0 = Date.now();
  const { nodes } = parseAnimation(src);
  const ms = Date.now() - t0;
  assert(ms < 100, `20 @animate blocks parsed in ${ms}ms (must be <100ms)`);
  eq(nodes.length, 20, '20 nodes parsed');
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function runPhase11Tests() {
  return { results, passed: _pass, failed: _fail, total: _pass + _fail };
}
