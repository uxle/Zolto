/**
 * Node.js CLI test runner for Zolto Phase 3.
 * Usage:  node tests/run-all.js
 */
import { runAllTests } from './tests.js';

const { results, passed, failed, total } = await runAllTests();

let suite = '';
for (const r of results) {
  if (r.suite !== suite) { suite = r.suite; console.log(`\n  ${suite}`); }
  if (r.pass) {
    console.log(`    ✓ ${r.desc}`);
  } else {
    console.log(`    ✗ ${r.desc}`);
    if (r.error) console.log(`      → ${r.error.split('\n')[0]}`);
  }
}
const icon = failed === 0 ? '✓' : '✗';
console.log(`\n${'─'.repeat(62)}`);
console.log(`${icon}  ${passed}/${total} tests passed${failed ? ` · ${failed} failed` : ' · all green'}`);
process.exit(failed > 0 ? 1 : 0);
