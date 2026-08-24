import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/zolto.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'Zolto',
  outfile: 'dist/zolto.min.js',
});

console.log('Built dist/zolto.min.js');
