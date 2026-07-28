# Migration Guide

## From standard Markdown to Zolto v1.0

Zolto is a strict superset of CommonMark. You do not need to change anything to start using Zolto! Just rename your `.md` files to `.zl` and run `zolto build document.zl`.

### Admonitions
If you were using HTML tags for alerts, you can now use native callouts:
\`\`\`markdown
> [!NOTE]
> This is a native Zolto callout.
\`\`\`

### Diagrams
If you used mermaid blocks (\`\`\`mermaid), Zolto now natively supports `@diagram`.
\`\`\`zolto
@diagram flowchart
  A -> B
@/diagram
\`\`\`
