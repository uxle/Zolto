# Frequently Asked Questions (FAQ)

**Q: Is Zolto fully backward-compatible with standard Markdown?**  
A: Yes! Every valid CommonMark document is a valid Zolto document.

**Q: Does Zolto require Node.js at runtime?**  
A: No. Zolto compiles your document into pure, native HTML/CSS/SVG with zero runtime dependencies. The output can be hosted anywhere.

**Q: Can I use React or Vue components in Zolto?**  
A: Zolto uses its own native component system (Phase 9) for maximum performance and zero dependencies. You cannot directly import React components, but you can build equivalent interactive structures using \`@form\` and \`@state\`.

**Q: How do I style my documents?**  
A: Use the Phase 15 Universal Theme system by overriding the CSS tokens (\`--zl-bg-canvas\`, etc.) or building a \`.zltheme\` package.
