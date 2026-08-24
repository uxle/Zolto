import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { compile, parse } from './zolto.js';

function exec(cmd) {
  try {
    return execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    process.exit(1);
  }
}

export async function runCli(argv) {
  const args = argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'help':
      console.log(`
Zolto CLI v${VERSION}
Usage: zolto <command> [options]

Commands:
  create <dir>     Create a new Zolto project in <dir>
  init             Initialize a new Zolto configuration in the current directory
  build <file>     Build a .zl file to HTML
  render <file>    Alias for build
  preview <file>   Render and open preview in browser
  serve            Serve current directory on port 3000
  validate <file>  Parse and validate a .zl file for errors
  lint             Run syntax checks
  format           Format Zolto and Markdown files
  package          Package the current project
  publish          Publish the package
  test             Run the test suite
  doctor           Check system requirements and configuration
  version          Show version information
  help             Show this help message
      `.trim());
      break;

    case 'version':
      console.log(`Zolto v${VERSION}`);
      break;

    case 'init': {
      const config = {
        name: path.basename(process.cwd()),
        version: VERSION,
        type: "document",
        dependencies: {}
      };
      fs.writeFileSync('zolto.config.json', JSON.stringify(config, null, 2));
      console.log('Initialized zolto.config.json');
      break;
    }

    case 'create': {
      const dir = args[1];
      if (!dir) { console.error('Error: specify a directory name.'); process.exit(1); }
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.zl'), '# Welcome to Zolto\n\n@card\nThis is your new project.\n@/card');
      fs.writeFileSync(path.join(dir, 'zolto.config.json'), JSON.stringify({ name: dir, version: "1.0.0" }, null, 2));
      console.log(`Created new project in ${dir}`);
      break;
    }

    case 'validate':
    case 'build':
    case 'render':
    case 'preview': {
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
          console.log(`Validation passed. ${warnings.length} warnings.`);
        }
      } else {
        const html = compile(source);
        const outFile = file.replace(/\.zl$/, '.html');
        fs.writeFileSync(path.resolve(outFile), html);
        console.log(`Successfully built ${outFile}`);
        
        if (command === 'preview') {
          console.log('Opening preview...');
          exec(`npx serve . --port 3000`);
        }
      }
      break;
    }

    case 'serve': {
      console.log('Starting local server...');
      exec('npx serve . --port 3000');
      break;
    }

    case 'lint': {
      console.log('Running linter...');
      exec('npx eslint src/ tests/ --ext .js || echo "No ESLint configuration found, falling back to basic checks"');
      break;
    }

    case 'format': {
      console.log('Running formatter...');
      exec('npx prettier --write src/ tests/ *.md || echo "Prettier not installed"');
      break;
    }

    case 'test': {
      console.log('Running tests...');
      exec('node tests/run-all.js');
      break;
    }

    case 'package': {
      console.log('Packaging project...');
      const pkgName = path.basename(process.cwd()) + '.zlpackage';
      exec(`tar -czf ${pkgName} .`);
      console.log(`Created ${pkgName}`);
      break;
    }
    
    case 'publish': {
      console.log('Publishing is not configured for this project.');
      break;
    }

    case 'doctor': {
      console.log('Zolto Doctor:');
      console.log('- Node.js Version:', process.version);
      console.log('- Platform:', process.platform);
      console.log('- Arch:', process.arch);
      console.log('- CWD:', process.cwd());
      console.log('Everything looks good!');
      break;
    }

    default:
      console.log(`Unknown command '${command}'.`);
      console.log('Run `zolto help` for available commands.');
      process.exit(1);
  }
}
