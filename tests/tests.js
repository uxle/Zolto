/**
 * Zolto Combined Test Suite — Phase 1 + 2 + 3 + 4 + 5
 *
 * Runs the Phase 2 suite (tests-p2.js — includes full Phase 1 regression),
 * Phase 3 suite (tests-p3.js — native block directives), Phase 4 suite
 * (tests-p4.js — native mathematics engine), and Phase 5 suite (tests-p5.js — native diagram engine).
 *
 * Export: runAllTests() → { results, passed, failed, total }
 */

import { runP2Tests } from './tests-p2.js';
import { runP3Tests } from './tests-p3.js';
import { runP4Tests } from './tests-p4.js';
import { runP5Tests } from './tests-p5.js';
import { runP6Tests } from './tests-p6.js';
import { runPhase7Tests } from './tests-p7.js';
import { runPhase8Tests } from './tests-p8.js';
import { runPhase9Tests } from './tests-p9.js';
import { runPhase10Tests } from './tests-p10.js';
import { runPhase11Tests } from './tests-p11.js';
import { runPhase12Tests } from './tests-p12.js';
import { runPhase13Tests } from './tests-p13.js';
import { runPhase14Tests } from './tests-p14.js';
import { runPhase15Tests } from './tests-p15.js';

export function runAllTests() {
  const p2 = runP2Tests();
  const p3 = runP3Tests();
  const p4 = runP4Tests();
  const p5 = runP5Tests();
  const p6 = runP6Tests();
  const p7 = runPhase7Tests();
  const p8 = runPhase8Tests();
  const p9 = runPhase9Tests();
  const p10 = runPhase10Tests();
  const p11 = runPhase11Tests();
  const p12 = runPhase12Tests();
  const p13 = runPhase13Tests();
  const p14 = runPhase14Tests();
  const p15 = runPhase15Tests();

  const p7Results = [
    { suite: 'Phase 7 · Vector Graphics Engine', desc: 'Vector Parser & Renderer Fixtures', pass: p7.failed === 0 }
  ];
  const p8Results = [
    { suite: 'Phase 8 · Spatial Layout & Canvas Engine', desc: 'Layout, Grid, Flex, Canvas & Presentation Suite', pass: p8.failed === 0 }
  ];
  const p9Results = [
    { suite: 'Phase 9 · Component, Template & Macro System', desc: 'Components, Templates, Macros, Props, Slots, Conditionals & Loops Suite', pass: p9.failed === 0 }
  ];
  const p10Results = [
    { suite: 'Phase 10 · Interactive Documents & Educational Features', desc: 'Forms, Quiz, Flashcards, Polls, Tasks, State, Bindings, Validation, Renderer Suite', pass: p10.failed === 0 }
  ];
  const p11Results = [
    { suite: 'Phase 11 · Animation & Presentation Runtime', desc: 'Animations, Keyframes, Timelines, Presentations, Slides, Speaker Notes, Accessibility, Performance', pass: p11.failed === 0 }
  ];
  const p12Results = [
    { suite: 'Phase 12 · Plugin API & Extension System', desc: 'Manifests, Lifecycle, Dependency Resolution, Priority Hooks, Custom Directives & Renderers, Themes, Data Providers, Permissions, Sandboxing, SemVer Checks', pass: p12.failed === 0 }
  ];
  const p13Results = [
    { suite: 'Phase 13 · Language Server, IDE Integration & Compiler Optimizations', desc: 'LSP Handlers, Auto-Completion, Hover Help, Diagnostics, Formatter, Linter, Refactoring, Document Indexer, Search, Incremental Pipeline, Caching', pass: p13.failed === 0 }
  ];
  const p14Results = [
    { suite: 'Phase 14 · Collaboration, Versioning & Production Ecosystem', desc: 'Real-time Presence, Threaded Comments, Version Checkpoints, Branch Merging, Workspace Packaging, Publishing Pipeline, Multi-format Exporters, RBAC Access Control, Backup & Audit Trail', pass: p14.failed === 0 }
  ];
  const p15Results = [
    { suite: 'Phase 15 · Universal Theme & Design System', desc: 'Light, Dark, Eye Protection Palettes, Design Tokens, Theme Engine, Runtime Theme Switching, Theme Packages, WCAG AAA Contrast Validation', pass: p15.failed === 0 }
  ];

  return {
    results: [...p2.results, ...p3.results, ...p4.results, ...p5.results, ...p6.results, ...p7Results, ...p8Results, ...p9Results, ...p10Results, ...p11Results, ...p12Results, ...p13Results, ...p14Results, ...p15Results],
    passed:  p2.passed + p3.passed + p4.passed + p5.passed + p6.passed + p7.passed + p8.passed + p9.passed + p10.passed + p11.passed + p12.passed + p13.passed + p14.passed + p15.passed,
    failed:  p2.failed + p3.failed + p4.failed + p5.failed + p6.failed + p7.failed + p8.failed + p9.failed + p10.failed + p11.failed + p12.failed + p13.failed + p14.failed + p15.failed,
    total:   p2.total  + p3.total  + p4.total  + p5.total  + p6.total  + (p7.passed + p7.failed) + p8.total + p9.total + p10.total + p11.total + p12.total + p13.total + p14.total + p15.total,
  };
}
