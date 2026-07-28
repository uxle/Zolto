# Best Practices

## Performance
- **Minimize DOM Depth**: While Zolto can handle 1000s of elements, avoiding deeply nested `@layout` grids keeps the browser fast.
- **Use Components**: If you find yourself copying the same `@card` setup multiple times, extract it into a `component`.

## Plugin Authoring
- **Always Namespace**: Always prefix your custom directives (e.g. `@acme-login` instead of `@login`) to avoid clashes with future Zolto releases.
- **Use the Validator**: Rely on the AST validation hooks to throw errors before rendering.

## Theming
- Keep overrides scoped. Don't write global CSS if you can just override `--zl-bg-canvas` for a specific section.
