/**
 * Zolto Test Runner — Phase 2
 *
 * A lightweight, zero-dependency test framework that runs in the browser.
 * No process.exit(), no Node APIs — results are returned as plain objects.
 *
 * Usage:
 *   import { createSuite, assert, eq, contains, notContains } from './runner.js';
 *
 *   const suite = createSuite('Headings');
 *   suite.test('renders H1', () => {
 *     eq(compile('# Hello'), '<h1 id="hello">Hello</h1>');
 *   });
 *
 *   const results = suite.run();
 *   // [{ suite, desc, pass, error? }, ...]
 */

// ─── Suite ────────────────────────────────────────────────────────────────────

/**
 * Create a named test suite.
 * @param {string} name
 */
export function createSuite(name) {
  const tests = [];

  return {
    name,

    /**
     * Register a test case.
     * @param {string}   desc  Human-readable description
     * @param {Function} fn    Test body — throws on failure
     */
    test(desc, fn) {
      tests.push({ desc, fn });
    },

    /**
     * Run all registered tests and return results. Awaits each test body
     * sequentially, so both synchronous and `async` test functions are
     * handled correctly — a synchronous function's return value awaits to
     * itself, so this is safe for either kind of test, and sequential
     * execution avoids introducing races between tests that share state.
     * @returns {Promise<TestResult[]>}
     */
    async run() {
      const out = [];
      for (const t of tests) {
        try {
          await t.fn();
          out.push({ suite: name, desc: t.desc, pass: true, error: null });
        } catch (e) {
          out.push({
            suite: name,
            desc:  t.desc,
            pass:  false,
            error: e.message ?? String(e),
          });
        }
      }
      return out;
    },
  };
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

/**
 * Assert a truthy condition.
 * @param {*}      cond
 * @param {string} [msg]
 */
export function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'Assertion failed');
}

/**
 * Assert strict equality.
 * @param {*}      actual
 * @param {*}      expected
 * @param {string} [msg]
 */
export function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      msg ?? `Expected:\n  ${JSON.stringify(expected)}\nGot:\n  ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Assert that a string contains a substring.
 * @param {string} haystack
 * @param {string} needle
 * @param {string} [msg]
 */
export function contains(haystack, needle, msg) {
  if (!String(haystack).includes(needle)) {
    throw new Error(
      msg ?? `Expected output to contain:\n  ${JSON.stringify(needle)}\nGot:\n  ${JSON.stringify(haystack)}`
    );
  }
}

/**
 * Assert that a string does NOT contain a substring.
 * @param {string} haystack
 * @param {string} needle
 * @param {string} [msg]
 */
export function notContains(haystack, needle, msg) {
  if (String(haystack).includes(needle)) {
    throw new Error(
      msg ?? `Expected output NOT to contain:\n  ${JSON.stringify(needle)}`
    );
  }
}

/**
 * Assert that two values are deeply equal (JSON-comparison).
 * @param {*}      actual
 * @param {*}      expected
 * @param {string} [msg]
 */
export function deepEq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(
      msg ?? `Deep equality failed.\nExpected: ${b}\nGot:      ${a}`
    );
  }
}

// ─── Runner (runs multiple suites) ───────────────────────────────────────────

/**
 * Run an array of suites and return a flat result list plus a summary.
 * Suites (and the tests within them) run strictly sequentially, matching
 * the original synchronous behavior — only the awaiting of each test body
 * is new.
 * @param {Suite[]} suites
 * @returns {Promise<{ results: TestResult[], passed: number, failed: number, total: number }>}
 */
export async function runSuites(suites) {
  const results = [];
  for (const s of suites) {
    results.push(...(await s.run()));
  }
  const passed  = results.filter(r => r.pass).length;
  const failed  = results.filter(r => !r.pass).length;
  return { results, passed, failed, total: results.length };
}
