import fs from 'fs';
import path from 'path';
import { compile, parse } from './zolto.js';

export async function runCli(argv) {
  const args = argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'help':
      console.log(`
Zolto CLI v1.0.0
Usage: zolto <command> [options]

Commands:
  create <dir>     Create a new Zolto project in <dir>
  init             Initialize a new Zolto configuration in the current directory
  build <file>     Build a .zl file to HTML
  render <file>    Alias for build
  preview <file>   Render and open preview in browser (Requires serve)
  serve            Serve current directory on port 3000
  validate <file>  Parse and validate a .zl file for errors
  lint <dir>       Run ESLint checks
  format <dir>     Format Zolto and Markdown files
  package          Package the current project
  publish          Publish the package
  test             Run the test suite
  doctor           Check system requirements and configuration
  version          Show version information
  help             Show this help message
      `.trim());
      break;

    case 'version':
      console.log('Zolto v1.0.0');
      break;

    case 'validate':
    case 'build':
    case 'render': {
      const file = args[1];
      if (!file) {
        console.error('Error: Please specify a file.');
        process.exit(1);
      }
      const source = fs.readFileSync(path.resolve(file), 'utf8');
      const { ast, errors, warnings } = parse(source);
      
      if (command === 'validate') {
        if (errors.length) {
          console.error(`Validation failed with ${errors.length} errors.`);
          errors.forEach(e => console.error(e));
          process.exit(1);
        } else {
          console.log(\`Validation passed. \${warnings.length} warnings.\`);
        }
      } else {
        const html = compile(source);
        const outFile = file.replace(/\\.zl$/, '.html');
        fs.writeFileSync(path.resolve(outFile), html);
        console.log(\`Successfully built \${outFile}\`);
      }
      break;
    }

    default:
      console.log(\`Command '\${command}' is not yet implemented in the v1.0 CLI stub.\`);
      console.log('Run \\`zolto help\\` for available commands.');
  }
}
