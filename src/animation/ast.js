/**
 * Zolto Animation & Presentation AST — Phase 11
 *
 * Monomorphic AST node factories for animations, keyframes, motion tokens,
 * transitions, timelines, presentations, slides, and speaker notes.
 *
 * Contract:
 *   - All fields are present on every node (no missing keys)
 *   - Missing optional values use null, not undefined
 *   - Collections use arrays, never null
 */

export const ANIMATION_NODE_TYPES = Object.freeze({
  ANIMATION_DEF:      'animation_def',
  KEYFRAMES_DEF:      'keyframes_def',
  KEYFRAME_STEP:      'keyframe_step',
  MOTION_TOKEN:       'motion_token',
  TRANSITION_DEF:     'transition_def',
  ANIM_TIMELINE:      'anim_timeline',
  ANIM_STEP:          'anim_step',
  REVEAL_TRIGGER:     'reveal_trigger',
  PRESENTATION:       'presentation',
  SLIDE:              'slide',
  SPEAKER_NOTE:       'speaker_note',
  ANIMATION_TARGET:   'animation_target',
});

export const ANIMATION_TYPES = Object.freeze([
  'fade', 'slide', 'scale', 'rotate', 'flip', 'blur',
  'bounce', 'pulse', 'shake', 'wobble', 'glow',
  'expand', 'collapse', 'stagger', 'morph',
]);

export const SLIDE_TYPES = Object.freeze([
  'title', 'section', 'content', 'comparison',
  'image', 'chart', 'diagram', 'code',
  'quote', 'agenda', 'closing',
]);

export const VALID_EASINGS = Object.freeze([
  'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
]);

// ─── Animation Definition ─────────────────────────────────────────────────────

export function createAnimationDef(name, props = [], meta = {}) {
  return {
    type:       ANIMATION_NODE_TYPES.ANIMATION_DEF,
    name:       String(name || ''),
    duration:   meta.duration != null ? Number(meta.duration) : 300,
    delay:      meta.delay != null ? Number(meta.delay) : 0,
    easing:     String(meta.easing || 'ease'),
    iteration:  meta.iteration != null ? meta.iteration : 1,
    direction:  String(meta.direction || 'normal'),
    fillMode:   String(meta.fillMode || 'both'),
    animType:   String(meta.animType || 'fade'),
    props:      Array.isArray(props) ? props : [],
    stagger:    meta.stagger != null ? Number(meta.stagger) : null,
    reducedOk:  meta.reducedOk !== false,
  };
}

// ─── Keyframes Definition ─────────────────────────────────────────────────────

export function createKeyframesDef(name, steps = []) {
  return {
    type:  ANIMATION_NODE_TYPES.KEYFRAMES_DEF,
    name:  String(name || ''),
    steps: Array.isArray(steps) ? steps : [],
  };
}

export function createKeyframeStep(percent, declarations = []) {
  return {
    type:         ANIMATION_NODE_TYPES.KEYFRAME_STEP,
    percent:      Number(percent),
    declarations: Array.isArray(declarations) ? declarations : [],
  };
}

// ─── Motion Token ─────────────────────────────────────────────────────────────

export function createMotionToken(name, value, meta = {}) {
  return {
    type:     ANIMATION_NODE_TYPES.MOTION_TOKEN,
    name:     String(name || ''),
    value:    String(value || ''),
    category: String(meta.category || 'duration'),
    cssVar:   meta.cssVar || `--zl-motion-${String(name || '').replace(/[^a-z0-9-]/g, '-')}`,
  };
}

// ─── Transition Definition ────────────────────────────────────────────────────

export function createTransitionDef(properties = [], meta = {}) {
  return {
    type:       ANIMATION_NODE_TYPES.TRANSITION_DEF,
    properties: Array.isArray(properties) ? properties : [],
    duration:   meta.duration != null ? Number(meta.duration) : 200,
    delay:      meta.delay != null ? Number(meta.delay) : 0,
    easing:     String(meta.easing || 'ease'),
    trigger:    String(meta.trigger || 'entry'),
  };
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function createTimeline(steps = [], meta = {}) {
  return {
    type:  ANIMATION_NODE_TYPES.ANIM_TIMELINE,
    id:    meta.id || null,
    auto:  meta.auto !== false,
    loop:  meta.loop === true,
    steps: Array.isArray(steps) ? steps : [],
  };
}

export function createTimelineStep(content = '', meta = {}) {
  return {
    type:     ANIMATION_NODE_TYPES.ANIM_STEP,
    delay:    meta.delay != null ? Number(meta.delay) : 0,
    duration: meta.duration != null ? Number(meta.duration) : null,
    content:  String(content || ''),
    id:       meta.id || null,
    highlight: meta.highlight === true,
  };
}

// ─── Reveal Trigger ───────────────────────────────────────────────────────────

export function createRevealTrigger(targetId, meta = {}) {
  return {
    type:      ANIMATION_NODE_TYPES.REVEAL_TRIGGER,
    targetId:  String(targetId || ''),
    trigger:   String(meta.trigger || 'enter'),
    threshold: meta.threshold != null ? Number(meta.threshold) : 0.2,
    animation: meta.animation || null,
    once:      meta.once !== false,
  };
}

// ─── Presentation ─────────────────────────────────────────────────────────────

export function createPresentation(slides = [], meta = {}) {
  return {
    type:        ANIMATION_NODE_TYPES.PRESENTATION,
    id:          meta.id || null,
    title:       String(meta.title || ''),
    theme:       String(meta.theme || 'dark'),
    ratio:       String(meta.ratio || '16:9'),
    transition:  String(meta.transition || 'fade'),
    autoplay:    meta.autoplay === true,
    loop:        meta.loop === true,
    controls:    meta.controls !== false,
    progress:    meta.progress !== false,
    slideNumber: meta.slideNumber !== false,
    slides:      Array.isArray(slides) ? slides : [],
  };
}

// ─── Slide ────────────────────────────────────────────────────────────────────

export function createSlide(content = '', meta = {}) {
  return {
    type:        ANIMATION_NODE_TYPES.SLIDE,
    id:          meta.id || null,
    title:       String(meta.title || ''),
    slideType:   String(meta.slideType || 'content'),
    theme:       meta.theme || null,
    transition:  meta.transition || null,
    background:  meta.background || null,
    content:     String(content || ''),
    notes:       Array.isArray(meta.notes) ? meta.notes : [],
    animations:  Array.isArray(meta.animations) ? meta.animations : [],
    index:       meta.index != null ? Number(meta.index) : 0,
  };
}

// ─── Speaker Note ─────────────────────────────────────────────────────────────

export function createSpeakerNote(content = '', meta = {}) {
  return {
    type:    ANIMATION_NODE_TYPES.SPEAKER_NOTE,
    content: String(content || ''),
    cue:     meta.cue || null,
    timing:  meta.timing != null ? Number(meta.timing) : null,
  };
}

// ─── Animation Target ─────────────────────────────────────────────────────────

export function createAnimationTarget(targetId, animationName, meta = {}) {
  return {
    type:          ANIMATION_NODE_TYPES.ANIMATION_TARGET,
    targetId:      String(targetId || ''),
    animationName: String(animationName || ''),
    delay:         meta.delay != null ? Number(meta.delay) : 0,
    trigger:       String(meta.trigger || 'load'),
  };
}

// ─── Type guard ───────────────────────────────────────────────────────────────

const _ALL = new Set(Object.values(ANIMATION_NODE_TYPES));
export function isAnimationNode(node) {
  return node != null && _ALL.has(node.type);
}
