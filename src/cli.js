import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { compile, parse } from './zolto.js';

// Single source of truth for the version string — computed once at module
// load and read from package.json, so it can never drift out of sync again
// (previously "1.0.0" was hardcoded in two places and had drifted from the
// real version; a later manual edit referenced a bare `VERSION` identifier
// without ever defining it, which crashed every invocation of `help`,
// `version`, and `init` with a ReferenceError — fixed by actually defining
// it here).
function getVersion() {
  try {
    const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  } catch {
    return 'unknown';
  }
}
const VERSION = getVersion();

function exec(cmd) {
  try {
    return execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    process.exit(1);
  }
}

// Runs a tool via npx, distinguishing "the tool genuinely isn't available"
// from "the tool ran and found real problems" — the previous `cmd || echo
// "not installed"` pattern reported every nonzero exit (including real
// lint errors / unformatted files) as a missing dependency, which hid
// exactly the failures the command exists to surface.
function execTool(pkgName, cmd, notFoundMessage) {
  try {
    execSync(`npx --no-install ${pkgName} --version`, { stdio: 'ignore' });
  } catch {
    console.log(notFoundMessage);
    return;
  }
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    process.exit(1); // real failure from the tool itself — propagate it
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
        version: "1.0.0",
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
      let source;
      try {
        source = fs.readFileSync(path.resolve(file), 'utf8');
      } catch (e) {
        console.error(`Error: could not read "${file}" — ${e.code === 'ENOENT' ? 'file not found.' : e.message}`);
        process.exit(1);
      }
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
          console.log(`Opening preview — serving ${path.dirname(path.resolve(outFile))} at http://localhost:3000/${path.basename(outFile)}`);
          exec(`npx serve "${path.dirname(path.resolve(outFile))}" --port 3000`);
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
      execTool('eslint', 'npx eslint src/ tests/ --ext .js', 'ESLint is not installed. Run `npm install --save-dev eslint` to enable linting.');
      break;
    }

    case 'format': {
      console.log('Running formatter...');
      execTool('prettier', 'npx prettier --write src/ tests/ *.md', 'Prettier is not installed. Run `npm install --save-dev prettier` to enable formatting.');
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
      // Exclude the usual junk (previously packaged the entire cwd
      // unfiltered, which would bundle node_modules and .git into every
      // release artifact).
      const excludes = ['node_modules', '.git', 'dist', '*.zlpackage', '.DS_Store']
        .map(p => `--exclude='${p}'`).join(' ');
      exec(`tar -czf ${pkgName} ${excludes} .`);
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
      const problems = [];
      const requiredNode = 20;
      const majorVersion = parseInt(process.version.slice(1), 10);
      if (Number.isFinite(majorVersion) && majorVersion < requiredNode) {
        problems.push(`Node.js ${process.version} is below the required >=${requiredNode}.0.0 (see package.json "engines").`);
      }
      if (problems.length) {
        console.log('Issues found:');
        problems.forEach(p => console.log('  - ' + p));
        process.exit(1);
      } else {
        console.log('Everything looks good!');
      }
      break;
    }

    default:
      console.log(`Unknown command '${command}'.`);
      console.log('Run `zolto help` for available commands.');
      process.exit(1);
  }
}
