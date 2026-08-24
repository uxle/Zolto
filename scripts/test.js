#!/usr/bin/env node
/**
 * scripts/test.js — Test runner entry point
 * Delegates to tests/run-all.js (the real runner).
 * Usage:  node scripts/test.js
 */
import { runAllTests } from '../tests/tests.js';

const { results, passed, failed, total } = await runAllTests();
for (const r of results)
  if (!r.pass) console.error(`  ✗ [${r.suite}] ${r.desc}\n    ${r.error?.split('\n')[0]}`);

console.log(`\n${passed}/${total} passed${failed ? `, ${failed} failed` : ' — all green ✓'}`);
process.exit(failed > 0 ? 1 : 0);
