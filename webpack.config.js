// Webpack config — reserved for Phase N production bundle.
// Phase 2 ships as ES modules with zero bundling required.
export default {
  entry:  './src/zolto.js',
  output: { filename: 'zolto.min.js', library: { type: 'module' } },
  experiments: { outputModule: true },
};
