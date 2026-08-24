#!/usr/bin/env node
/**
 * scripts/analyze-bundle.js — Bundle size analysis
 * Shows the current size of each source file in src/.
 */
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
const src = new URL('../src', import.meta.url).pathname;
let total = 0;
for (const f of readdirSync(src).sort()) {
  const sz = statSync(join(src, f)).size;
  total += sz;
  console.log(`  ${(sz/1024).toFixed(1).padStart(6)} KB  ${f}`);
}
console.log(`  ${'─'.repeat(28)}`);
console.log(`  ${(total/1024).toFixed(1).padStart(6)} KB  total (src/ only)`);
