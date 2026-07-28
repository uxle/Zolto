# Contributing to Zolto

First off, thank you for considering contributing to Zolto! It's people like you that make Zolto such a great tool.

## 1. Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally: `git clone https://github.com/uxle/zolto.git`
3. **Install dependencies**: `npm install`

## 2. Development Workflow

- Zolto has **Zero Dependencies** at runtime. Ensure you do not add dependencies to `dependencies` in `package.json`. You may add tooling to `devDependencies`.
- Test your changes locally: `npm run test:node`
- Run the syntax checker: `npm run check`

## 3. Pull Request Process

1. Ensure all tests pass.
2. Update the documentation if you are changing an API.
3. Submit a Pull Request targeting the `main` branch.
4. Fill out the Pull Request template comprehensively.
