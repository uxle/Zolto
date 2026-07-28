// Jest config — reserved for Phase N when the test suite
// migrates to a Jest-compatible format.
// Phase 2 uses the native Node.js test runner (tests/run-all.js).
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  testMatch: ['**/tests/**/*.test.js'],
};
