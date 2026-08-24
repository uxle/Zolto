/**
 * Zolto Interactive Styles — Phase 10
 *
 * All CSS for interactive elements. Injected once per document.
 * Includes form fields, buttons, quiz, flashcards, polls, task lists,
 * tabs, accordions, dark mode, focus rings, and reduced-motion support.
 */

export const INTERACTIVE_CSS = `
/* ─── Zolto Interactive v10 ─────────────────────────────────────── */

/* ── Reset / Base ────────────────────────────────────────────────── */
.zl-interactive *,
.zl-interactive *::before,
.zl-interactive *::after { box-sizing: border-box; }

.zl-interactive {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--zl-text, #1a202c);
  line-height: 1.6;
}

/* ── Form layout ─────────────────────────────────────────────────── */
.zl-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--zl-form-bg, #ffffff);
  border: 1px solid var(--zl-border, #e2e8f0);
  border-radius: 0.75rem;
  max-width: 640px;
}

/* ── Fields ──────────────────────────────────────────────────────── */
.zl-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.zl-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--zl-label-color, #374151);
}

.zl-label-required::after {
  content: ' *';
  color: #ef4444;
}

.zl-input, .zl-textarea, .zl-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--zl-text, #1a202c);
  background: var(--zl-input-bg, #f9fafb);
  border: 1.5px solid var(--zl-border, #d1d5db);
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: none;
}

.zl-input:focus, .zl-textarea:focus, .zl-select:focus {
  border-color: var(--zl-focus-ring, #6366f1);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.zl-input:disabled, .zl-textarea:disabled, .zl-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--zl-disabled-bg, #f3f4f6);
}

.zl-textarea { resize: vertical; min-height: 6rem; }

.zl-help {
  font-size: 0.8rem;
  color: var(--zl-help-color, #6b7280);
  margin-top: 0.15rem;
}

.zl-error-msg {
  font-size: 0.8rem;
  color: #dc2626;
  margin-top: 0.15rem;
  display: none;
}

.zl-field[data-invalid] .zl-error-msg { display: block; }
.zl-field[data-invalid] .zl-input,
.zl-field[data-invalid] .zl-textarea,
.zl-field[data-invalid] .zl-select {
  border-color: #dc2626;
}

/* ── Checkbox & Radio ─────────────────────────────────────────────── */
.zl-check-field, .zl-radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9375rem;
}

.zl-check-field input[type=checkbox],
.zl-radio-option input[type=radio] {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--zl-accent, #6366f1);
  cursor: pointer;
  flex-shrink: 0;
}

.zl-radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
.zl-radio-group-label { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem; color: #374151; }

/* ── Toggle / Switch ─────────────────────────────────────────────── */
.zl-toggle-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
}

.zl-toggle-track {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  background: var(--zl-border, #d1d5db);
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.zl-toggle-track.on { background: var(--zl-accent, #6366f1); }

.zl-toggle-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 1.125rem; height: 1.125rem;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.zl-toggle-track.on .zl-toggle-thumb { transform: translateX(1.25rem); }

/* ── Segmented control ───────────────────────────────────────────── */
.zl-segment {
  display: inline-flex;
  border: 1.5px solid var(--zl-border, #d1d5db);
  border-radius: 0.5rem;
  overflow: hidden;
  font-size: 0.875rem;
}

.zl-segment-item {
  padding: 0.4rem 0.85rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  color: var(--zl-text, #374151);
  transition: background 0.15s, color 0.15s;
}

.zl-segment-item + .zl-segment-item { border-left: 1.5px solid var(--zl-border, #d1d5db); }
.zl-segment-item.active, .zl-segment-item:focus {
  background: var(--zl-accent, #6366f1);
  color: #fff;
  outline: none;
}

/* ── Slider ──────────────────────────────────────────────────────── */
.zl-slider-field { display: flex; flex-direction: column; gap: 0.4rem; }
.zl-slider-row   { display: flex; align-items: center; gap: 0.75rem; }

.zl-slider {
  flex: 1;
  accent-color: var(--zl-accent, #6366f1);
  cursor: pointer;
  height: 0.25rem;
}

.zl-slider-value {
  min-width: 2.5rem;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--zl-accent, #6366f1);
}

/* ── Progress bar ────────────────────────────────────────────────── */
.zl-progress-block { display: flex; flex-direction: column; gap: 0.25rem; }
.zl-progress-track {
  width: 100%;
  height: 0.625rem;
  background: var(--zl-border, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
}

.zl-progress-fill {
  height: 100%;
  background: var(--zl-accent, #6366f1);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.zl-progress-label { font-size: 0.8rem; color: var(--zl-help-color, #6b7280); }

/* ── Buttons ─────────────────────────────────────────────────────── */
.zl-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.125rem;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 2px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s, box-shadow 0.15s;
  white-space: nowrap;
  user-select: none;
}

.zl-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.35);
}

.zl-btn-primary   { background: var(--zl-accent, #6366f1); color: #fff; }
.zl-btn-primary:hover { background: #4f46e5; }

.zl-btn-secondary { background: #f3f4f6; color: #374151; }
.zl-btn-secondary:hover { background: #e5e7eb; }

.zl-btn-ghost     { background: transparent; color: var(--zl-accent, #6366f1); }
.zl-btn-ghost:hover { background: rgba(99,102,241,0.08); }

.zl-btn-danger    { background: #ef4444; color: #fff; }
.zl-btn-danger:hover { background: #dc2626; }

.zl-btn-outline {
  background: transparent;
  color: var(--zl-accent, #6366f1);
  border-color: var(--zl-accent, #6366f1);
}
.zl-btn-outline:hover { background: rgba(99,102,241,0.06); }

.zl-btn-icon { padding: 0.5rem; border-radius: 0.4rem; }

.zl-btn:disabled, .zl-btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.zl-btn-loading { position: relative; pointer-events: none; }
.zl-btn-loading::after {
  content: '';
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid rgba(255,255,255,0.6);
  border-top-color: transparent;
  border-radius: 50%;
  animation: zl-spin 0.7s linear infinite;
  margin-left: 0.4rem;
}

@keyframes zl-spin { to { transform: rotate(360deg); } }

/* ── Quiz ────────────────────────────────────────────────────────── */
.zl-quiz {
  border: 1px solid var(--zl-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: var(--zl-form-bg, #fff);
}

.zl-quiz-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--zl-text, #1a202c);
}

.zl-question {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--zl-input-bg, #f9fafb);
  border-radius: 0.5rem;
  border-left: 3px solid var(--zl-accent, #6366f1);
}

.zl-question-text {
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.75rem;
  color: var(--zl-text, #1a202c);
}

.zl-options { display: flex; flex-direction: column; gap: 0.5rem; }

.zl-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.9375rem;
}

.zl-option:hover { background: rgba(99,102,241,0.07); }
.zl-option input  { accent-color: var(--zl-accent, #6366f1); flex-shrink: 0; }

/* Post-grading feedback states, applied by the runtime after "Check Answers" */
.zl-option.zl-opt-correct   { background: rgba(16,185,129,0.12); box-shadow: inset 0 0 0 1px rgba(16,185,129,0.4); }
.zl-option.zl-opt-incorrect { background: rgba(239,68,68,0.12);  box-shadow: inset 0 0 0 1px rgba(239,68,68,0.4); }
.zl-opt-explain {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--zl-text-secondary, #6b7280);
}
.zl-opt-explain[hidden] { display: none; }

.zl-quiz-hint, .zl-quiz-explain {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
}

.zl-quiz-hint    { background: #fef3c7; color: #92400e; border-left: 3px solid #f59e0b; }
.zl-quiz-explain { background: #d1fae5; color: #065f46; border-left: 3px solid #10b981; }
.zl-quiz-explain[hidden] { display: none; }
.zl-quiz-explain-label { font-weight: 700; margin-right: 0.35rem; }

.zl-question.zl-answered-correct   { box-shadow: inset 3px 0 0 #10b981; }
.zl-question.zl-answered-incorrect { box-shadow: inset 3px 0 0 #ef4444; }

.zl-quiz-score {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1e40af;
  margin-top: 1rem;
  display: none;
}

.zl-timer {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--zl-accent, #6366f1);
  padding: 0.3rem 0.75rem;
  border: 1.5px solid var(--zl-accent, #6366f1);
  border-radius: 9999px;
  margin-bottom: 1rem;
}

/* ── Flashcards ──────────────────────────────────────────────────── */
.zl-deck { display: flex; flex-direction: column; gap: 1.25rem; }

.zl-deck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.9375rem;
}

.zl-card-viewport {
  perspective: 1000px;
  min-height: 12rem;
}

.zl-card-inner {
  position: relative;
  width: 100%;
  height: 12rem;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
  cursor: pointer;
}

.zl-card-inner.flipped { transform: rotateY(180deg); }

.zl-card-face, .zl-card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  font-size: 1.0625rem;
  font-weight: 600;
}

.zl-card-face {
  background: var(--zl-accent, #6366f1);
  color: #fff;
  border: none;
}

.zl-card-back {
  background: var(--zl-form-bg, #fff);
  color: var(--zl-text, #1a202c);
  border: 2px solid var(--zl-accent, #6366f1);
  transform: rotateY(180deg);
}

.zl-deck-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.zl-deck-counter { font-size: 0.875rem; color: var(--zl-help-color, #6b7280); }

.zl-deck-progress-bar {
  height: 4px;
  background: var(--zl-border, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
}

.zl-deck-progress-fill {
  height: 100%;
  background: var(--zl-accent, #6366f1);
  transition: width 0.3s ease;
}

/* ── Poll ────────────────────────────────────────────────────────── */
.zl-poll {
  border: 1px solid var(--zl-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1.25rem;
  background: var(--zl-form-bg, #fff);
}

.zl-poll-question {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--zl-text, #1a202c);
}

.zl-poll-options { display: flex; flex-direction: column; gap: 0.5rem; }

.zl-poll-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
  cursor: pointer;
  border: 1.5px solid var(--zl-border, #e5e7eb);
  transition: border-color 0.15s, background 0.15s;
  font-size: 0.9375rem;
}

.zl-poll-option:hover { border-color: var(--zl-accent, #6366f1); background: rgba(99,102,241,0.04); }
.zl-poll-option input  { accent-color: var(--zl-accent, #6366f1); flex-shrink: 0; }

.zl-poll-bar-row { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.4rem; }
.zl-poll-bar-label { font-size: 0.875rem; display: flex; justify-content: space-between; }
.zl-poll-bar-track {
  height: 0.5rem;
  background: var(--zl-border, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
}
.zl-poll-bar-fill {
  height: 100%;
  background: var(--zl-accent, #6366f1);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

/* ── Task list ────────────────────────────────────────────────────── */
.zl-tasks { display: flex; flex-direction: column; gap: 0.35rem; }

.zl-task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.zl-task-item > label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; flex: 1; }

.zl-task-item input[type=checkbox] {
  width: 1.0625rem;
  height: 1.0625rem;
  accent-color: var(--zl-accent, #6366f1);
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.zl-task-item input:checked + span {
  text-decoration: line-through;
  color: var(--zl-help-color, #9ca3af);
}

.zl-task-children { margin-left: 1.75rem; display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.25rem; }

/* ── Tabs (interactive) ──────────────────────────────────────────── */
.zl-itabs {}

.zl-itab-strip {
  display: flex;
  border-bottom: 2px solid var(--zl-border, #e2e8f0);
  margin-bottom: 1rem;
  gap: 0.125rem;
  overflow-x: auto;
}

.zl-itab-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--zl-help-color, #6b7280);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.zl-itab-btn:hover { color: var(--zl-accent, #6366f1); }
.zl-itab-btn.active {
  color: var(--zl-accent, #6366f1);
  border-bottom-color: var(--zl-accent, #6366f1);
}

.zl-itab-panel { display: none; }
.zl-itab-panel.active { display: block; }

/* ── Accordion ───────────────────────────────────────────────────── */
.zl-accordion { display: flex; flex-direction: column; gap: 0.5rem; }

.zl-accordion-section {
  border: 1px solid var(--zl-border, #e2e8f0);
  border-radius: 0.5rem;
  overflow: hidden;
}

.zl-accordion-section summary {
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--zl-input-bg, #f9fafb);
  user-select: none;
  transition: background 0.15s;
}

.zl-accordion-section summary::-webkit-details-marker { display: none; }
.zl-accordion-section summary::after {
  content: '›';
  font-size: 1.2rem;
  transform: rotate(90deg);
  transition: transform 0.2s;
  color: var(--zl-help-color, #9ca3af);
}

.zl-accordion-section[open] summary { background: rgba(99,102,241,0.06); }
.zl-accordion-section[open] summary::after { transform: rotate(-90deg); }

.zl-accordion-body { padding: 1rem; }

/* ── Focus rings (accessibility) ─────────────────────────────────── */
:focus-visible {
  outline: 2.5px solid var(--zl-focus-ring, #6366f1);
  outline-offset: 2px;
}

/* ── Reduced motion ──────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .zl-card-inner { transition: none; }
  .zl-btn-loading::after { animation: none; border-top-color: currentColor; }
  .zl-toggle-track, .zl-toggle-thumb, .zl-progress-fill, .zl-poll-bar-fill { transition: none; }
}

/* ── Dark mode ───────────────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  .zl-interactive {
    --zl-text: #f1f5f9;
    --zl-label-color: #e2e8f0;
    --zl-form-bg: #1e2330;
    --zl-input-bg: #252d3d;
    --zl-border: #334155;
    --zl-help-color: #94a3b8;
    --zl-disabled-bg: #1e2330;
  }
  .zl-quiz-hint    { background: #451a03; color: #fcd34d; }
  .zl-quiz-explain { background: #064e3b; color: #6ee7b7; }
  .zl-quiz-score   { background: #1e3a5f; color: #93c5fd; }
  .zl-option.zl-opt-correct   { background: rgba(16,185,129,0.18); }
  .zl-option.zl-opt-incorrect { background: rgba(239,68,68,0.18); }
}

/* ── High contrast ───────────────────────────────────────────────── */
@media (forced-colors: active) {
  .zl-btn { border: 2px solid ButtonText; }
  .zl-input, .zl-textarea, .zl-select { border-color: ButtonText; }
  .zl-toggle-track { border: 2px solid ButtonText; }
}
`;
