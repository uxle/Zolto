/**
 * Zolto CLI — integration tests
 *
 * cli.js has no prior test coverage at all (every branch calls
 * process.exit() directly, which is awkward to unit-test in-process), so
 * this runs the real binary as a subprocess and checks its actual output —
 * the only way that would have caught the real regression this file
 * exists to guard against: a manual edit referenced a bare `VERSION`
 * identifier that was never defined, crashing `zolto version`, `zolto
 * help`, and `zolto init` with a ReferenceError on every invocation.
 */
import { execFileSync } from 'child_process';
import { readFileSync, mkdtempSync } from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import { createSuite, assert, eq } from '../runner.js';

const suite = createSuite('CLI · bin/zolto.js');
const BIN = fileURLToPath(new URL('../../bin/zolto.js', import.meta.url));
const PKG_VERSION = JSON.parse(readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8')).version;

function run(args) {
  try {
    const stdout = execFileSync('node', [BIN, ...args], { encoding: 'utf8' });
    return { stdout, code: 0 };
  } catch (e) {
    return { stdout: e.stdout || '', stderr: e.stderr || '', code: e.status };
  }
}

suite.test('BUG: `zolto version` crashed with "VERSION is not defined" after a manual edit referenced an undeclared identifier', () => {
  const { stdout, code, stderr } = run(['version']);
  assert(code === 0, `expected exit code 0, got ${code}${stderr ? ' — ' + stderr : ''}`);
  assert(!stdout.includes('ReferenceError'), 'must not crash with a ReferenceError');
  eq(stdout.trim(), `Zolto v${PKG_VERSION}`, 'must print the real package.json version, not a stale or undefined one');
});

suite.test('`zolto help` prints the real version in its banner without crashing', () => {
  const { stdout, code } = run(['help']);
  eq(code, 0);
  assert(stdout.includes(`Zolto CLI v${PKG_VERSION}`), 'help banner must include the current package.json version');
});

suite.test('`zolto init` writes a config without crashing, and does not default a new project to the CLI\'s own version', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'zolto-cli-test-'));
  const result = execFileSync('node', [BIN, 'init'], { cwd: tmp, encoding: 'utf8' });
  assert(!result.includes('ReferenceError'), 'init must not crash');
  const config = JSON.parse(readFileSync(path.join(tmp, 'zolto.config.json'), 'utf8'));
  eq(config.version, '1.0.0', 'a newly-created project should start at its own 1.0.0, not inherit the CLI tool\'s version');
});

export default suite;
