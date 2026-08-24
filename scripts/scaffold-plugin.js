#!/usr/bin/env node
/**
 * scripts/scaffold-plugin.js — Generate a new plugin skeleton
 * Usage:  node scripts/scaffold-plugin.js my-plugin
 */
import { mkdirSync, writeFileSync } from 'fs';
const name = process.argv[2];
if (!name) { console.error('Usage: node scripts/scaffold-plugin.js <plugin-name>'); process.exit(1); }
const dir = `plugins/builtins/${name}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/index.js`, `/**
 * Zolto Plugin — ${name}
 * @type {ZoltoPlugin}
 */
export default {
  name:    '${name}',
  version: '0.1.0',
  install(api) {
    // Register renderers, parser rules, etc.
    console.log('[Zolto] Plugin "${name}" installed');
  },
  uninstall(api) {
    console.log('[Zolto] Plugin "${name}" uninstalled');
  },
};
`);
writeFileSync(`${dir}/styles.css`, `/* ${name} plugin styles */
`);
console.log(`Scaffolded plugin: ${dir}/index.js`);
