# Zolto VS Code Extension (React + TypeScript) — AI Agent Prompt

## Objective

Build a production-quality Visual Studio Code extension for **Zolto**, a next-generation Markdown-inspired document language.

The extension must provide an exceptional developer experience with a modern React/TSX-based interface while remaining modular, scalable, fast, and maintainable.

The codebase should follow clean architecture principles and be designed for long-term development.

---

# Technology Stack

Use only modern technologies.

Core

* TypeScript
* React 19
* TSX
* VS Code Extension API
* Vite
* ESBuild
* Node.js

UI

* React
* Tailwind CSS
* Radix UI
* Lucide Icons
* Motion
* Zustand

Editor

* Monaco Editor

Rendering

* React
* HTML
* CSS
* WebView API

Language Backend

* Language Server Protocol (LSP)

Future-ready support

* Rust Language Server
* WebAssembly parser

---

# UI Design

Design language should be inspired by

* VS Code
* GitHub
* Linear
* Raycast
* macOS

Requirements

* beautiful
* minimal
* smooth
* modern
* responsive
* keyboard friendly
* accessible

---

# Features

## File Support

Support

* .zl
* .zolto

Recognize files automatically.

---

## Syntax Highlighting

Implement

* headings
* emphasis
* code blocks
* math
* directives
* tables
* lists
* diagrams
* charts
* layouts
* components
* variables
* references
* comments

---

## IntelliSense

Provide

* autocomplete
* snippets
* hover
* signature help
* parameter hints
* smart suggestions
* context awareness

---

## Diagnostics

Detect

* syntax errors
* invalid directives
* missing closing blocks
* invalid attributes
* duplicate IDs
* broken references
* invalid math
* invalid diagrams
* invalid charts

Diagnostics must include

* severity
* code
* quick explanation
* possible fix

---

## Formatting

Support

* format document
* format selection
* auto format on save

Formatter must be deterministic.

---

## Navigation

Support

* outline
* document symbols
* workspace symbols
* go to definition
* find references
* rename symbol
* breadcrumbs

---

## Preview

Build a beautiful live preview.

Requirements

* split editor
* instant refresh
* synchronized scrolling
* zoom
* print preview
* export preview

---

## Theme Support

Support

* Light
* Dark
* Eye Protection

Theme switching should happen instantly.

---

## Commands

Implement commands

* Create Document
* Preview
* Build
* Validate
* Export HTML
* Export PDF
* Export SVG
* Format
* Lint
* Show AST
* Open Settings

---

## Settings

Provide settings for

* theme
* formatter
* preview
* fonts
* line height
* auto save
* diagnostics
* animations

---

## Status Bar

Display

* parser status
* errors
* warnings
* current theme
* renderer
* document statistics

---

## Welcome Screen

Build a welcome page containing

* Create document
* Open example
* Documentation
* Playground
* Changelog
* Settings

---

## WebView

The preview panel must use React.

Never write raw DOM code unless absolutely necessary.

---

## Folder Structure

Generate a professional folder structure similar to

```text
zolto-vscode/
│
├── src/
│   ├── extension/
│   ├── commands/
│   ├── providers/
│   ├── lsp/
│   ├── preview/
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   ├── types/
│   └── constants/
│
├── webview/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── editor/
│   │   ├── preview/
│   │   ├── toolbar/
│   │   ├── sidebar/
│   │   ├── settings/
│   │   ├── themes/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── assets/
│   │
│   ├── index.html
│   └── vite.config.ts
│
├── syntaxes/
├── snippets/
├── themes/
├── media/
├── docs/
├── examples/
├── tests/
└── package.json
```

Generate as many folders as necessary.

---

## Code Quality

Every module should

* have one responsibility
* use TypeScript strictly
* avoid duplicated code
* avoid global state
* be reusable
* be testable

---

## Performance

Optimize for

* startup speed
* autocomplete speed
* diagnostics speed
* rendering speed
* preview speed
* low memory usage

Use lazy loading wherever appropriate.

---

## Accessibility

Support

* keyboard navigation
* screen readers
* focus indicators
* reduced motion
* high contrast
* large text

---

## Testing

Generate

* unit tests
* integration tests
* component tests
* snapshot tests

---

## Documentation

Automatically generate

* README
* API docs
* contributing guide
* architecture overview
* extension development guide

---

## Coding Rules

* Never create files longer than 800 lines.
* Prefer composition over inheritance.
* Use functional React components.
* Use React Hooks.
* Avoid class components.
* Use TypeScript strict mode.
* Use ESLint and Prettier.
* Use descriptive names.
* Keep components small.
* Build reusable UI components.
* Follow modern React best practices.

---

## Final Deliverable

Produce a complete, production-ready VS Code extension for Zolto with a polished React/TSX interface, robust language tooling, excellent performance, and a scalable architecture that can grow alongside the Zolto language ecosystem.
