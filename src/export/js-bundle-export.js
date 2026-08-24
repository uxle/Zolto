/**
 * Zolto JS Bundle Exporter
 * ════════════════════════════════════════════════════════════════════════════
 * Converts .zl documents into self-contained .js modules / bundles with:
 *   1. Pre-included responsive CSS (variables, prose, callouts, diagrams, charts, layouts, animations)
 *   2. Pre-included rendered HTML & SVGs
 *   3. Pre-included client-side JavaScript interactivity runtime (copy buttons, quizzes, flashcards, tabs, accordions)
 *
 * Supported Output Formats:
 *   - 'universal'     : ESM + UMD bundle with auto-mount capability
 *   - 'webcomponent'  : Custom Web Component (<zolto-document>) with Shadow DOM
 *   - 'iife'          : Self-executing standalone widget
 *   - 'esm'           : Clean ES Module export
 */

import { compile, parse } from '../zolto.js';
import { initZoltoInteractivity } from '../interactive/runtime.js';

// ─── Consolidated Zolto Standalone Stylesheet ────────────────────────────────
export const ZOLTO_EMBEDDED_CSS = `
/* ═══ ZOLTO STANDALONE DESIGN SYSTEM & RUNTIME STYLES ═══════════════════ */
:root, [data-theme="dark"] {
  --zl-font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --zl-font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --zl-bg-base: #0B0D0F;
  --zl-bg-surface: #15171B;
  --zl-bg-surface-raised: #1C1F23;
  --zl-bg-glass: rgba(21, 23, 27, 0.60);
  --zl-bg-glass-heavy: rgba(12, 14, 17, 0.86);
  --zl-bg-glass-soft: rgba(255, 255, 255, 0.03);
  --zl-bg-glass-hover: rgba(255, 255, 255, 0.07);
  --zl-border-subtle: rgba(255, 255, 255, 0.06);
  --zl-border-base: rgba(255, 255, 255, 0.10);
  --zl-border-strong: rgba(255, 255, 255, 0.18);
  --zl-primary: #5B9DFA;
  --zl-primary-dim: #3A7BD5;
  --zl-primary-glow: rgba(91, 157, 250, 0.35);
  --zl-primary-soft: rgba(91, 157, 250, 0.12);
  --zl-accent-purple: #9D7AFA;
  --zl-accent-green: #5EE29A;
  --zl-accent-amber: #FAB95B;
  --zl-accent-red: #F28B82;
  --zl-text-primary: #F4F5F7;
  --zl-text-secondary: #9CA3AF;
  --zl-text-tertiary: #5C6270;
  --zl-radius-sm: 8px;
  --zl-radius-md: 12px;
  --zl-radius-lg: 16px;
  --zl-radius-xl: 24px;
  --zl-radius-pill: 999px;
  --zl-shadow-sm: 0 2px 6px rgba(0,0,0,0.2);
  --zl-shadow-md: 0 6px 18px rgba(0,0,0,0.3);
  --zl-shadow-lg: 0 12px 32px rgba(0,0,0,0.45);
}

[data-theme="light"] {
  --zl-bg-base: #F8FAFC;
  --zl-bg-surface: #FFFFFF;
  --zl-bg-surface-raised: #F1F5F9;
  --zl-bg-glass: rgba(255, 255, 255, 0.80);
  --zl-bg-glass-heavy: rgba(248, 250, 252, 0.95);
  --zl-bg-glass-soft: rgba(0, 0, 0, 0.03);
  --zl-bg-glass-hover: rgba(0, 0, 0, 0.06);
  --zl-border-subtle: rgba(0, 0, 0, 0.06);
  --zl-border-base: rgba(0, 0, 0, 0.10);
  --zl-border-strong: rgba(0, 0, 0, 0.18);
  --zl-primary: #2563EB;
  --zl-primary-dim: #1D4ED8;
  --zl-primary-glow: rgba(37, 99, 235, 0.25);
  --zl-primary-soft: rgba(37, 99, 235, 0.10);
  --zl-accent-purple: #7C3AED;
  --zl-accent-green: #10B981;
  --zl-accent-amber: #F59E0B;
  --zl-accent-red: #EF4444;
  --zl-text-primary: #0F172A;
  --zl-text-secondary: #475569;
  --zl-text-tertiary: #94A3B8;
}

[data-theme="eyeprotection"] {
  --zl-bg-base: #FAF6ED;
  --zl-bg-surface: #F3ECE0;
  --zl-bg-surface-raised: #E9E1D2;
  --zl-bg-glass: rgba(243, 236, 224, 0.85);
  --zl-bg-glass-heavy: rgba(250, 246, 237, 0.95);
  --zl-bg-glass-soft: rgba(70, 50, 20, 0.04);
  --zl-bg-glass-hover: rgba(70, 50, 20, 0.08);
  --zl-border-subtle: rgba(70, 50, 20, 0.08);
  --zl-border-base: rgba(70, 50, 20, 0.14);
  --zl-border-strong: rgba(70, 50, 20, 0.22);
  --zl-primary: #8C6239;
  --zl-primary-dim: #704E2C;
  --zl-primary-glow: rgba(140, 98, 57, 0.25);
  --zl-primary-soft: rgba(140, 98, 57, 0.12);
  --zl-accent-purple: #7D5A8C;
  --zl-accent-green: #4E8C5A;
  --zl-accent-amber: #C97D28;
  --zl-accent-red: #B84A39;
  --zl-text-primary: #382D21;
  --zl-text-secondary: #635442;
  --zl-text-tertiary: #91816D;
}

/* Fallback token bridge for standard variables */
:root {
  --font-sans: var(--zl-font-sans);
  --font-mono: var(--zl-font-mono);
  --bg-base: var(--zl-bg-base);
  --bg-surface: var(--zl-bg-surface);
  --bg-surface-raised: var(--zl-bg-surface-raised);
  --bg-glass: var(--zl-bg-glass);
  --bg-glass-heavy: var(--zl-bg-glass-heavy);
  --bg-glass-soft: var(--zl-bg-glass-soft);
  --bg-glass-hover: var(--zl-bg-glass-hover);
  --border-subtle: var(--zl-border-subtle);
  --border-base: var(--zl-border-base);
  --border-strong: var(--zl-border-strong);
  --primary: var(--zl-primary);
  --primary-dim: var(--zl-primary-dim);
  --primary-glow: var(--zl-primary-glow);
  --primary-soft: var(--zl-primary-soft);
  --accent-purple: var(--zl-accent-purple);
  --accent-green: var(--zl-accent-green);
  --accent-amber: var(--zl-accent-amber);
  --accent-red: var(--zl-accent-red);
  --text-primary: var(--zl-text-primary);
  --text-secondary: var(--zl-text-secondary);
  --text-tertiary: var(--zl-text-tertiary);
  --radius-sm: var(--zl-radius-sm);
  --radius-md: var(--zl-radius-md);
  --radius-lg: var(--zl-radius-lg);
  --radius-xl: var(--zl-radius-xl);
  --radius-pill: var(--zl-radius-pill);
}

/* Container & Wrapper */
.zl-doc-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: clamp(1.2rem, 3vw, 2.5rem);
  background: var(--zl-bg-surface);
  color: var(--zl-text-secondary);
  font-family: var(--zl-font-sans);
  border-radius: var(--zl-radius-lg);
  border: 1px solid var(--zl-border-base);
  box-shadow: var(--zl-shadow-md);
  line-height: 1.8;
  font-size: 1rem;
  overflow-wrap: anywhere;
  word-break: break-word;
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Prose Typography */
.prose {
  font-family: var(--zl-font-sans);
  color: var(--zl-text-secondary);
  line-height: 1.8;
  font-size: 1rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: var(--zl-text-primary);
  font-weight: 700;
  line-height: 1.3;
  margin: 1.5em 0 0.5em;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.prose h1 { font-size: 2.25rem; font-weight: 800; border-bottom: 1px solid var(--zl-border-subtle); padding-bottom: 0.3em; }
.prose h2 { font-size: 1.6rem; border-bottom: 1px solid var(--zl-border-subtle); padding-bottom: 0.3em; }
.prose h3 { font-size: 1.3rem; }
.prose h4 { font-size: 1.1rem; }
.prose p { margin: 1em 0; overflow-wrap: anywhere; word-break: break-word; }
.prose strong { font-weight: 600; color: var(--zl-text-primary); }
.prose em { font-style: italic; }
.prose a { color: var(--zl-primary); text-decoration: none; transition: color 0.15s; }
.prose a:hover { color: var(--zl-primary-dim); text-decoration: underline; }
.prose code {
  background: var(--zl-bg-surface-raised);
  color: var(--zl-primary);
  padding: 0.2em 0.45em;
  border-radius: var(--zl-radius-sm);
  font-family: var(--zl-font-mono);
  font-size: 0.85em;
  border: 1px solid var(--zl-border-subtle);
}
.prose pre {
  background: var(--zl-bg-base);
  padding: 1rem;
  border-radius: var(--zl-radius-md);
  border: 1px solid var(--zl-border-base);
  overflow-x: auto;
  margin: 1.5em 0;
  max-width: 100%;
}
.prose pre code {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--zl-text-secondary);
  font-size: 0.88rem;
  font-family: var(--zl-font-mono);
}
.prose blockquote {
  border-left: 3.5px solid var(--zl-primary);
  background: var(--zl-bg-glass-soft);
  padding: 0.8em 1.2em;
  border-radius: 0 var(--zl-radius-md) var(--zl-radius-md) 0;
  margin: 1.5em 0;
  color: var(--zl-text-primary);
  font-style: italic;
}
.prose ul, .prose ol { padding-left: 1.5em; margin: 1em 0; }
.prose li { margin: 0.3em 0; }
.prose hr { border: none; border-top: 1px solid var(--zl-border-base); margin: 2em 0; }
.prose mark { background: rgba(250, 185, 91, 0.25); color: inherit; padding: 0.1em 0.3em; border-radius: 4px; }
.prose kbd {
  font-family: var(--zl-font-mono);
  font-size: 0.82em;
  padding: 0.18em 0.5em;
  background: var(--zl-bg-surface-raised);
  border: 1px solid var(--zl-border-strong);
  border-radius: 5px;
  box-shadow: 0 2px 0 var(--zl-border-strong);
  color: var(--zl-text-primary);
}

/* Callouts */
.prose .zl-callout {
  border-left: 3.5px solid var(--zl-primary);
  background: var(--zl-primary-soft);
  border-radius: 0 var(--zl-radius-md) var(--zl-radius-md) 0;
  padding: 1rem 1.25rem;
  margin: 1.5em 0;
}
.prose .zl-callout-title {
  font-weight: 700;
  color: var(--zl-primary);
  margin-bottom: 0.3em;
  display: flex;
  align-items: center;
  gap: 8px;
}
.prose .zl-callout-body { color: var(--zl-text-secondary); font-size: 0.95em; }
.prose .zl-callout-tip { border-left-color: var(--zl-accent-green); background: rgba(94, 226, 154, 0.08); }
.prose .zl-callout-tip .zl-callout-title { color: var(--zl-accent-green); }
.prose .zl-callout-warning { border-left-color: var(--zl-accent-amber); background: rgba(250, 185, 91, 0.08); }
.prose .zl-callout-warning .zl-callout-title { color: var(--zl-accent-amber); }
.prose .zl-callout-danger { border-left-color: var(--zl-accent-red); background: rgba(242, 139, 130, 0.08); }
.prose .zl-callout-danger .zl-callout-title { color: var(--zl-accent-red); }

/* Admonitions */
.prose .zl-admonition {
  border: 1px solid var(--zl-border-base);
  border-radius: var(--zl-radius-lg);
  margin: 1.2em 0;
  overflow: hidden;
  box-shadow: var(--zl-shadow-sm);
}
.prose .zl-admonition-header {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.7em 1.1em;
  font-weight: 700;
  font-size: 0.9em;
  background: var(--zl-primary-soft);
  color: var(--zl-primary);
  border-bottom: 1px solid var(--zl-border-base);
}
.prose .zl-admonition-body {
  padding: 1em 1.2em;
  color: var(--zl-text-secondary);
  background: var(--zl-bg-surface-raised);
}
.prose .zl-admonition-tip .zl-admonition-header, .prose .zl-admonition-success .zl-admonition-header {
  background: rgba(94, 226, 154, 0.12);
  color: var(--zl-accent-green);
}
.prose .zl-admonition-warning .zl-admonition-header, .prose .zl-admonition-caution .zl-admonition-header {
  background: rgba(250, 185, 91, 0.12);
  color: var(--zl-accent-amber);
}
.prose .zl-admonition-danger .zl-admonition-header {
  background: rgba(242, 139, 130, 0.12);
  color: var(--zl-accent-red);
}

/* Zolto Code Block Component */
.prose .zl-cb {
  margin: 1.3em 0;
  border-radius: var(--zl-radius-md);
  overflow: hidden;
  border: 1px solid var(--zl-border-base);
  box-shadow: var(--zl-shadow-md);
  background: var(--zl-bg-base);
}
.prose .zl-code-header {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.6em 1rem;
  background: var(--zl-bg-surface-raised);
  border-bottom: 1px solid var(--zl-border-base);
  font-family: var(--zl-font-mono);
  font-size: 0.8em;
}
.prose .zl-code-lang {
  color: var(--zl-primary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.prose .zl-code-title {
  color: var(--zl-text-secondary);
  flex: 1;
  font-weight: 500;
}
.prose .zl-copy {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.3em 0.75em;
  border-radius: var(--zl-radius-sm);
  border: 1px solid var(--zl-border-base);
  color: var(--zl-text-secondary);
  font-size: 0.8em;
  font-family: var(--zl-font-sans);
  background: var(--zl-bg-surface);
  cursor: pointer;
  transition: all 0.2s ease;
}
.prose .zl-copy:hover {
  color: var(--zl-text-primary);
  border-color: var(--zl-primary);
  background: var(--zl-primary-soft);
}
.prose .zl-copy.zl-copied {
  color: var(--zl-accent-green);
  border-color: var(--zl-accent-green);
  background: rgba(94, 226, 154, 0.15);
}
.prose .zl-pre {
  margin: 0;
  padding: 1rem 0;
  overflow-x: auto;
  background: transparent;
}
.prose .zl-pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.88rem;
  color: var(--zl-text-secondary);
  display: block;
  font-family: var(--zl-font-mono);
}
.prose .zl-ln { display: block; padding: 0 1.2rem; white-space: pre; }
.prose .zl-has-nums .zl-ln { padding-left: 3.8rem; position: relative; }
.prose .zl-has-nums .zl-ln::before {
  content: attr(data-n);
  position: absolute;
  left: 0;
  width: 3rem;
  text-align: right;
  color: var(--zl-text-tertiary);
  user-select: none;
  padding-right: 0.8rem;
}

/* Tables */
.prose .zl-table-wrap {
  overflow-x: auto;
  margin: 1.4em 0;
  border-radius: var(--zl-radius-md);
  border: 1px solid var(--zl-border-base);
  box-shadow: var(--zl-shadow-sm);
}
.prose .zl-table { width: 100%; border-collapse: collapse; font-size: 0.92em; margin: 0; }
.prose .zl-table th {
  background: var(--zl-bg-surface-raised);
  border-bottom: 1px solid var(--zl-border-base);
  padding: 0.8em 1.1em;
  font-weight: 700;
  color: var(--zl-text-primary);
  text-align: left;
}
.prose .zl-table td {
  border-bottom: 1px solid var(--zl-border-subtle);
  padding: 0.8em 1.1em;
  color: var(--zl-text-secondary);
}
.prose .zl-table tr:last-child td { border-bottom: none; }
.prose .zl-table tr:hover td { background: var(--zl-bg-glass-soft); }

/* Badges */
.lx-badge, .zl-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--zl-radius-pill);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: middle;
}
.lx-badge-blue, .zl-badge-primary { background: var(--zl-primary-soft); color: var(--zl-primary); }
.lx-badge-green, .zl-badge-success { background: rgba(94, 226, 154, 0.12); color: var(--zl-accent-green); }
.zl-badge-warning { background: rgba(250, 185, 91, 0.12); color: var(--zl-accent-amber); }
.zl-badge-danger { background: rgba(242, 139, 130, 0.12); color: var(--zl-accent-red); }

/* Directives & Components: Cards, Grids, Steps */
.zl-card {
  background: var(--zl-bg-surface-raised);
  border: 1px solid var(--zl-border-base);
  border-radius: var(--zl-radius-md);
  padding: 1.25rem;
  margin: 1rem 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.zl-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--zl-shadow-md);
}
.zl-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin: 1.2rem 0;
}
.zl-steps { list-style: none; margin: 1.4em 0; padding: 0; }
.zl-step { display: flex; gap: 1rem; margin-bottom: 1.5em; position: relative; }
.zl-step-marker {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: var(--zl-bg-surface);
  border: 2px solid var(--zl-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--zl-primary);
  font-size: 0.9rem;
}

/* Diagrams, Charts, Vectors SVGs */
.zl-diagram, .zl-chart, .zl-vector {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.5em auto;
  border-radius: var(--zl-radius-md);
  background: var(--zl-bg-surface-raised);
  border: 1px solid var(--zl-border-base);
  padding: 0.5rem;
  box-shadow: var(--zl-shadow-sm);
}

/* Interactive Components: Quizzes & Flashcards */
.zl-quiz {
  background: var(--zl-bg-surface-raised);
  border: 1px solid var(--zl-border-base);
  border-radius: var(--zl-radius-lg);
  padding: 1.5rem;
  margin: 1.5em 0;
}
.zl-quiz-title { font-weight: 700; color: var(--zl-text-primary); font-size: 1.1rem; margin-bottom: 1rem; }
.zl-quiz-opts { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.2rem; }
.zl-quiz-opt {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1rem;
  background: var(--zl-bg-surface);
  border: 1.5px solid var(--zl-border-base);
  border-radius: var(--zl-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.zl-quiz-opt:hover {
  border-color: var(--zl-primary);
  background: var(--zl-bg-glass-hover);
}
.zl-quiz-opt.selected {
  border-color: var(--zl-primary);
  background: var(--zl-primary-soft);
  color: var(--zl-text-primary);
}
.zl-quiz-opt.zl-opt-correct {
  border-color: var(--zl-accent-green);
  background: rgba(94, 226, 154, 0.15);
  color: var(--zl-accent-green);
}
.zl-quiz-opt.zl-opt-incorrect {
  border-color: var(--zl-accent-red);
  background: rgba(242, 139, 130, 0.15);
  color: var(--zl-accent-red);
}
.zl-quiz-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.4rem;
  background: var(--zl-primary);
  color: #fff;
  border-radius: var(--zl-radius-md);
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.zl-quiz-btn:hover { background: var(--zl-primary-dim); transform: translateY(-1px); }
.zl-quiz-feedback { margin-top: 1rem; font-weight: 600; font-size: 0.95rem; }

/* Flashcards */
.zl-flashcard-deck {
  margin: 1.5em 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.zl-flashcard {
  width: 100%;
  max-width: 480px;
  min-height: 220px;
  perspective: 1000px;
  cursor: pointer;
  margin-bottom: 1rem;
}
.zl-flashcard-inner {
  position: relative;
  width: 100%;
  min-height: 220px;
  text-align: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  border-radius: var(--zl-radius-lg);
  border: 1px solid var(--zl-border-base);
  box-shadow: var(--zl-shadow-md);
}
.zl-flashcard.is-flipped .zl-flashcard-inner { transform: rotateY(180deg); }
.zl-flashcard-front, .zl-flashcard-back {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-radius: var(--zl-radius-lg);
  background: var(--zl-bg-surface-raised);
}
.zl-flashcard-back {
  background: var(--zl-bg-surface);
  transform: rotateY(180deg);
  border: 1px solid var(--zl-primary);
}
.zl-fc-controls { display: flex; align-items: center; gap: 1rem; }
.zl-fc-btn {
  padding: 0.4rem 0.9rem;
  border-radius: var(--zl-radius-md);
  border: 1px solid var(--zl-border-base);
  background: var(--zl-bg-surface-raised);
  color: var(--zl-text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.zl-fc-btn:hover { background: var(--zl-primary-soft); border-color: var(--zl-primary); }

/* Theme Floating Switcher Widget */
.zl-theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--zl-radius-pill);
  border: 1px solid var(--zl-border-base);
  background: var(--zl-bg-surface-raised);
  color: var(--zl-text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.zl-theme-toggle-btn:hover {
  background: var(--zl-primary-soft);
  border-color: var(--zl-primary);
}
`.trim();

// ─── Embedded Interactivity JavaScript Runtime ────────────────────────────────
// ─── Embedded Interactivity JavaScript Runtime ────────────────────────────────
// Derived from the single canonical implementation in src/interactive/runtime.js
// (also used directly by the live editor app) via Function.prototype.toString(),
// instead of being hand-duplicated here — see that file's header comment for why.
export const ZOLTO_RUNTIME_JS = initZoltoInteractivity.toString();

// ─── Main JS Bundle Generator ────────────────────────────────────────────────
/**
 * Compile a .zl document source into a standalone .js module or script.
 *
 * @param {string} sourceZl  Raw .zl markdown string
 * @param {object} options
 * @param {'universal'|'webcomponent'|'iife'|'esm'} [options.format='universal']
 * @param {'dark'|'light'|'eyeprotection'|'auto'} [options.theme='dark']
 * @param {string} [options.targetSelector='#app']
 * @param {boolean} [options.shadowDom=false]
 * @param {boolean} [options.minify=false]
 * @param {string} [options.title='Zolto Document']
 * @returns {{ js: string, html: string, css: string, metadata: object }}
 */
export function generateJsBundle(sourceZl, options = {}) {
  const {
    format = 'universal',
    theme = 'dark',
    targetSelector = '#app',
    shadowDom = false,
    minify = false,
    title = 'Zolto Document',
  } = options;

  // 1. Compile AST and rendered HTML
  const { ast, errors, warnings } = parse(sourceZl);
  const compiledBodyHtml = compile(sourceZl);

  // 2. Wrap HTML inside a styled container
  const fullHtml = `<div class="zl-doc-container" data-theme="${theme}">\n<div class="prose">\n${compiledBodyHtml}\n</div>\n</div>`;

  // 3. Prepare bundled CSS
  const bundledCss = ZOLTO_EMBEDDED_CSS;

  // 4. Generate JavaScript based on format
  let jsCode = '';

  const encodedHtml = JSON.stringify(fullHtml);
  const encodedCss = JSON.stringify(bundledCss);
  const encodedZl = JSON.stringify(sourceZl);
  const encodedTitle = JSON.stringify(title);

  if (format === 'webcomponent') {
    jsCode = `/**
 * Zolto Custom Web Component Bundle — Generated from .zl
 * Pre-included CSS, JS Runtime, and HTML
 */
(function() {
  const TITLE = ${encodedTitle};
  const CSS = ${encodedCss};
  const HTML = ${encodedHtml};
  const SOURCE_ZL = ${encodedZl};

  ${ZOLTO_RUNTIME_JS}

  class ZoltoDocumentElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const theme = this.getAttribute('theme') || '${theme}';
      const styleEl = document.createElement('style');
      styleEl.textContent = CSS;
      
      const wrapper = document.createElement('div');
      wrapper.innerHTML = HTML;
      const docContainer = wrapper.querySelector('.zl-doc-container');
      if (docContainer) docContainer.setAttribute('data-theme', theme);

      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(styleEl);
      this.shadowRoot.appendChild(wrapper.firstElementChild);

      initZoltoInteractivity(this.shadowRoot);
    }
  }

  if (!customElements.get('zolto-document')) {
    customElements.define('zolto-document', ZoltoDocumentElement);
  }
  if (!customElements.get('zolto-doc')) {
    customElements.define('zolto-doc', ZoltoDocumentElement);
  }

  // Also export global object
  if (typeof window !== 'undefined') {
    window.ZoltoDocument = {
      title: TITLE,
      html: HTML,
      css: CSS,
      source: SOURCE_ZL,
      element: ZoltoDocumentElement
    };
  }
})();
`;
  } else if (format === 'iife') {
    jsCode = `/**
 * Zolto Self-Mounting Standalone Widget — Generated from .zl
 * Pre-included CSS, JS Runtime, and HTML
 */
(function() {
  const TITLE = ${encodedTitle};
  const CSS = ${encodedCss};
  const HTML = ${encodedHtml};

  ${ZOLTO_RUNTIME_JS}

  function mount() {
    let styleTag = document.getElementById('zolto-standalone-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'zolto-standalone-styles';
      styleTag.textContent = CSS;
      document.head.appendChild(styleTag);
    }

    const target = document.querySelector('${targetSelector}') || document.getElementById('app') || document.body;
    if (target) {
      target.innerHTML = HTML;
      initZoltoInteractivity(target);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
`;
  } else if (format === 'esm') {
    jsCode = `/**
 * Zolto ES Module Bundle — Generated from .zl
 * Pre-included CSS, JS Runtime, and HTML
 */
export const title = ${encodedTitle};
export const html = ${encodedHtml};
export const css = ${encodedCss};
export const source = ${encodedZl};

${ZOLTO_RUNTIME_JS}

export function injectStyles(targetDoc = document) {
  let styleTag = targetDoc.getElementById('zolto-standalone-styles');
  if (!styleTag) {
    styleTag = targetDoc.createElement('style');
    styleTag.id = 'zolto-standalone-styles';
    styleTag.textContent = css;
    targetDoc.head.appendChild(styleTag);
  }
  return styleTag;
}

export function mount(targetSelectorOrElement = '${targetSelector}', options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;

  injectStyles(doc);

  const container = typeof targetSelectorOrElement === 'string'
    ? doc.querySelector(targetSelectorOrElement)
    : targetSelectorOrElement;

  if (container) {
    container.innerHTML = html;
    initZoltoInteractivity(container);
    return container;
  }
  return null;
}

export default {
  title,
  html,
  css,
  source,
  injectStyles,
  mount,
  initZoltoInteractivity
};
`;
  } else {
    // Default: 'universal' (UMD + ESM + Auto-mount)
    jsCode = `/**
 * Zolto Universal Document Module (UMD / ESM / Script)
 * Generated from .zl file with pre-included CSS, JS Interactivity, and HTML
 * ════════════════════════════════════════════════════════════════════════════
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ZoltoDocument = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const title = ${encodedTitle};
  const html = ${encodedHtml};
  const css = ${encodedCss};
  const source = ${encodedZl};

  ${ZOLTO_RUNTIME_JS}

  function injectStyles(doc = document) {
    if (!doc || !doc.head) return null;
    let styleTag = doc.getElementById('zolto-standalone-styles');
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.id = 'zolto-standalone-styles';
      styleTag.textContent = css;
      doc.head.appendChild(styleTag);
    }
    return styleTag;
  }

  function mount(targetSelectorOrElement = '${targetSelector}', options = {}) {
    if (typeof document === 'undefined') return null;
    injectStyles(document);

    const target = typeof targetSelectorOrElement === 'string'
      ? document.querySelector(targetSelectorOrElement)
      : targetSelectorOrElement;

    if (target) {
      target.innerHTML = html;
      initZoltoInteractivity(target);
      return target;
    }
    return null;
  }

  // Auto-mount if a dedicated container exists
  if (typeof document !== 'undefined') {
    const autoMount = () => {
      const el = document.querySelector('[data-zolto-auto-mount]') || document.querySelector('${targetSelector}');
      if (el && !el.dataset.zoltoMounted) {
        el.dataset.zoltoMounted = 'true';
        mount(el);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoMount);
    } else {
      setTimeout(autoMount, 0);
    }
  }

  return {
    title: title,
    html: html,
    css: css,
    source: source,
    injectStyles: injectStyles,
    mount: mount,
    init: initZoltoInteractivity
  };
});
`;
  }

  return {
    js: jsCode,
    html: fullHtml,
    css: bundledCss,
    metadata: {
      title,
      format,
      theme,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      nodeCount: ast.children ? ast.children.length : 0,
      sizeBytes: new TextEncoder().encode(jsCode).length,
    }
  };
}
