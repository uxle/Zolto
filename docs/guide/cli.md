# Command Line Interface (CLI)

Zolto provides a unified CLI for managing your projects.

## Installation

\`\`\`bash
npm install -g zolto
# OR use the installer script
curl -sSL https://raw.githubusercontent.com/uxle/zolto/main/install.sh | bash
\`\`\`

## Commands

- \`zolto init\`: Initialize a new project in the current directory.
- \`zolto create <dir>\`: Scaffold a complete project in a new directory.
- \`zolto build <file>\`: Compile a \`.zl\` file into an HTML file.
- \`zolto preview <file>\`: Compile and instantly open in a local web server.
- \`zolto validate <file>\`: Validate the document against the AST rules.
- \`zolto serve\`: Run a local development server for the current directory.
- \`zolto doctor\`: Run system checks to ensure your environment is configured correctly.
- \`zolto package\`: Bundle your project into a distributable archive.
