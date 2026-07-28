/**
 * Zolto Animation Motion Tokens & CSS — Phase 11
 *
 * Motion design token CSS custom properties and base animation stylesheet.
 * All @keyframes are wrapped in @media (prefers-reduced-motion: no-preference)
 * to respect accessibility settings.
 */

// ─── Default motion tokens ────────────────────────────────────────────────────

export const DEFAULT_MOTION_TOKENS = Object.freeze({
  '--zl-motion-fast':          '120ms',
  '--zl-motion-medium':        '240ms',
  '--zl-motion-slow':          '420ms',
  '--zl-motion-ease':          'cubic-bezier(0.2, 0, 0, 1)',
  '--zl-motion-ease-in':       'cubic-bezier(0.4, 0, 1, 1)',
  '--zl-motion-ease-out':      'cubic-bezier(0, 0, 0.2, 1)',
  '--zl-motion-spring':        'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--zl-motion-distance-sm':   '8px',
  '--zl-motion-distance-md':   '16px',
  '--zl-motion-distance-lg':   '32px',
});

// ─── Base animation CSS ───────────────────────────────────────────────────────

export const ANIMATION_CSS = `/* Zolto Animation Engine — Phase 11 */

/* ── Motion tokens ──────────────────────────────────────────────────────── */
:root {
  --zl-motion-fast:          120ms;
  --zl-motion-medium:        240ms;
  --zl-motion-slow:          420ms;
  --zl-motion-ease:          cubic-bezier(0.2, 0, 0, 1);
  --zl-motion-ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --zl-motion-ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --zl-motion-spring:        cubic-bezier(0.34, 1.56, 0.64, 1);
  --zl-motion-distance-sm:   8px;
  --zl-motion-distance-md:   16px;
  --zl-motion-distance-lg:   32px;
  /* slide deck */
  --zl-slide-bg:             #0f1117;
  --zl-slide-text:           #f1f5f9;
  --zl-slide-accent:         #6366f1;
  --zl-slide-muted:          #64748b;
  --zl-slide-radius:         12px;
  --zl-slide-padding:        3.5rem;
}

/* ── Reduced-motion override ────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:       0.01ms !important;
    animation-iteration-count:1      !important;
    transition-duration:      0.01ms !important;
    scroll-behavior:          auto   !important;
  }
  .zl-anim, [data-zl-animate] {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}

/* ── Base animation classes ─────────────────────────────────────────────── */
.zl-anim {
  animation-fill-mode: both;
}
.zl-anim[data-zl-animate="fadeIn"]      { animation: zl-fadeIn      var(--zl-motion-medium) var(--zl-motion-ease-out); }
.zl-anim[data-zl-animate="fadeOut"]     { animation: zl-fadeOut      var(--zl-motion-medium) var(--zl-motion-ease-in); }
.zl-anim[data-zl-animate="slideInUp"]   { animation: zl-slideInUp    var(--zl-motion-medium) var(--zl-motion-ease-out); }
.zl-anim[data-zl-animate="slideInDown"] { animation: zl-slideInDown  var(--zl-motion-medium) var(--zl-motion-ease-out); }
.zl-anim[data-zl-animate="slideInLeft"] { animation: zl-slideInLeft  var(--zl-motion-medium) var(--zl-motion-ease-out); }
.zl-anim[data-zl-animate="slideInRight"]{ animation: zl-slideInRight var(--zl-motion-medium) var(--zl-motion-ease-out); }
.zl-anim[data-zl-animate="scaleIn"]    { animation: zl-scaleIn      var(--zl-motion-medium) var(--zl-motion-spring); }
.zl-anim[data-zl-animate="popIn"]      { animation: zl-popIn        var(--zl-motion-medium) var(--zl-motion-spring); }
.zl-anim[data-zl-animate="bounceIn"]   { animation: zl-bounceIn     var(--zl-motion-slow)   var(--zl-motion-spring); }
.zl-anim[data-zl-animate="pulse"]      { animation: zl-pulse        var(--zl-motion-slow)   ease infinite; }
.zl-anim[data-zl-animate="shake"]      { animation: zl-shake        var(--zl-motion-fast)   ease; }
.zl-anim[data-zl-animate="wobble"]     { animation: zl-wobble       var(--zl-motion-medium) ease; }
.zl-anim[data-zl-animate="glow"]       { animation: zl-glow         var(--zl-motion-slow)   ease infinite; }
.zl-anim[data-zl-animate="blur"]       { animation: zl-blur         var(--zl-motion-medium) var(--zl-motion-ease-out); }

/* ── Stagger support ────────────────────────────────────────────────────── */
[data-zl-stagger] > * {
  animation-fill-mode: both;
}
[data-zl-stagger] > *:nth-child(1)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 0); }
[data-zl-stagger] > *:nth-child(2)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 1); }
[data-zl-stagger] > *:nth-child(3)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 2); }
[data-zl-stagger] > *:nth-child(4)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 3); }
[data-zl-stagger] > *:nth-child(5)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 4); }
[data-zl-stagger] > *:nth-child(6)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 5); }
[data-zl-stagger] > *:nth-child(7)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 6); }
[data-zl-stagger] > *:nth-child(8)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 7); }
[data-zl-stagger] > *:nth-child(9)  { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 8); }
[data-zl-stagger] > *:nth-child(10) { animation-delay: calc(var(--zl-stagger-delay, 80ms) * 9); }

/* ── Timeline ───────────────────────────────────────────────────────────── */
.zl-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding-left: 1.5rem;
}
.zl-timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 2px;
  background: var(--zl-slide-accent, #6366f1);
  border-radius: 2px;
  opacity: 0.3;
}
.zl-timeline-step {
  position: relative;
  padding: 0.75rem 1rem;
  background: rgba(99,102,241,0.06);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 8px;
}
.zl-timeline-step::before {
  content: '';
  position: absolute;
  left: -1.25rem;
  top: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--zl-slide-accent, #6366f1);
}

/* ── Presentation deck ──────────────────────────────────────────────────── */
.zl-presentation {
  width: 100%;
  container-type: inline-size;
}
.zl-presentation-deck {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--zl-slide-radius, 12px);
  background: var(--zl-slide-bg, #0f1117);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.zl-presentation-deck[data-ratio="4:3"] { aspect-ratio: 4 / 3; }

.zl-slide {
  position: absolute;
  inset: 0;
  padding: var(--zl-slide-padding, 3.5rem);
  color: var(--zl-slide-text, #f1f5f9);
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
}
.zl-slide.zl-slide--active {
  display: flex;
}
.zl-slide--title { justify-content: center; align-items: center; text-align: center; }
.zl-slide--section { background: var(--zl-slide-accent, #6366f1); }
.zl-slide--comparison { flex-direction: row; gap: 2rem; }
.zl-slide--closing { justify-content: center; align-items: center; text-align: center; }

.zl-slide h1, .zl-slide h2, .zl-slide h3 { color: var(--zl-slide-text, #f1f5f9); margin: 0 0 1rem; }
.zl-slide h1 { font-size: clamp(2rem, 5cqw, 4rem); font-weight: 800; }
.zl-slide h2 { font-size: clamp(1.5rem, 3.5cqw, 2.75rem); font-weight: 700; }
.zl-slide h3 { font-size: clamp(1.25rem, 2.5cqw, 2rem); font-weight: 600; }
.zl-slide p  { font-size: clamp(0.9rem, 2cqw, 1.25rem); color: var(--zl-slide-muted, #94a3b8); line-height: 1.7; }
.zl-slide ul, .zl-slide ol { font-size: clamp(0.9rem, 1.8cqw, 1.15rem); line-height: 1.8; padding-left: 1.5rem; }

/* ── Speaker notes (hidden from public view) ────────────────────────────── */
.zl-speaker-note {
  display: none;
}

/* ── Presentation controls ──────────────────────────────────────────────── */
.zl-presentation-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(15,17,23,0.8);
  border-radius: 0 0 var(--zl-slide-radius, 12px) var(--zl-slide-radius, 12px);
}
.zl-slide-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #f1f5f9;
  cursor: pointer;
  font-size: 1rem;
  transition: background var(--zl-motion-fast, 120ms) ease;
}
.zl-slide-btn:hover { background: rgba(99,102,241,0.3); }
.zl-slide-btn:focus-visible { outline: 2px solid var(--zl-slide-accent, #6366f1); outline-offset: 2px; }

.zl-slide-progress {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}
.zl-slide-progress-bar {
  height: 100%;
  background: var(--zl-slide-accent, #6366f1);
  transition: width var(--zl-motion-medium, 240ms) var(--zl-motion-ease, cubic-bezier(0.2,0,0,1));
}

.zl-slide-counter {
  font-size: 0.8rem;
  color: var(--zl-slide-muted, #64748b);
  white-space: nowrap;
}

/* ── Slide outline / TOC navigation ────────────────────────────────────── */
.zl-slide-outline {
  margin-top: 1rem;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.zl-slide-outline li a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.15);
  color: var(--zl-slide-muted, #64748b);
  text-decoration: none;
  transition: background var(--zl-motion-fast, 120ms) ease;
}
.zl-slide-outline li a:hover { background: rgba(99,102,241,0.18); color: #f1f5f9; }

/* ── Reveal triggers (intersection observer hook) ───────────────────────── */
[data-zl-reveal] {
  opacity: 0;
}
[data-zl-reveal].zl-revealed {
  opacity: 1;
}
@media (prefers-reduced-motion: no-preference) {
  [data-zl-reveal] { transition: opacity var(--zl-motion-medium, 240ms) ease, transform var(--zl-motion-medium, 240ms) ease; }
  [data-zl-reveal]:not(.zl-revealed) { transform: translateY(var(--zl-motion-distance-md, 16px)); }
}

/* ── Built-in @keyframes ────────────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  @keyframes zl-fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes zl-fadeOut {
    from { opacity: 1; } to { opacity: 0; }
  }
  @keyframes zl-slideInUp {
    from { opacity: 0; transform: translateY(var(--zl-motion-distance-md, 16px)); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes zl-slideInDown {
    from { opacity: 0; transform: translateY(calc(-1 * var(--zl-motion-distance-md, 16px))); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes zl-slideInLeft {
    from { opacity: 0; transform: translateX(calc(-1 * var(--zl-motion-distance-md, 16px))); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes zl-slideInRight {
    from { opacity: 0; transform: translateX(var(--zl-motion-distance-md, 16px)); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes zl-scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes zl-popIn {
    0%   { opacity: 0; transform: scale(0.9); }
    60%  { transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes zl-bounceIn {
    0%   { opacity: 0; transform: scale(0.3); }
    50%  { opacity: 1; transform: scale(1.1); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  @keyframes zl-pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.05); }
  }
  @keyframes zl-shake {
    0%, 100% { transform: translateX(0); }
    25%       { transform: translateX(-4px); }
    75%       { transform: translateX(4px); }
  }
  @keyframes zl-wobble {
    0%, 100% { transform: rotate(0deg); }
    25%       { transform: rotate(-5deg); }
    75%       { transform: rotate(5deg); }
  }
  @keyframes zl-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
    70%       { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
  }
  @keyframes zl-blur {
    from { filter: blur(8px); opacity: 0; }
    to   { filter: blur(0);   opacity: 1; }
  }
}
`;
