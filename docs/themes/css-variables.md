# CSS Variables Reference

All Zolto **editor UI** design tokens are defined in
[`css/core/variables.css`](../../css/core/variables.css) under `:root`,
and it's the only stylesheet the app actually loads for tokens (see
`index.html`). There is no separate `css/base/` copy — that directory
was dead, unloaded code and has been removed.

## Token categories

| Prefix | Tokens | Example |
| :----- | :----- | :------ |
| `--bg-*` | Surfaces | `--bg-base`, `--bg-surface`, `--bg-surface-raised`, `--bg-glass` |
| `--border-*` | Borders | `--border-subtle`, `--border-base`, `--border-strong` |
| `--primary`, `--accent-*` | Accents | `--primary`, `--primary-dim`, `--accent-purple`, `--accent-green`, `--accent-amber`, `--accent-red` |
| `--text-*` | Text colours | `--text-primary`, `--text-secondary`, `--text-tertiary` |
| `--space-*` | Spacing scale (8px base) | `--space-1` (8px) … `--space-8` (64px) |
| `--radius-*` | Corner radii | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-pill` |
| `--ease-*`, `--dur-*` | Motion | `--ease-spring`, `--ease-soft`, `--dur-fast`, `--dur-base`, `--dur-slow` |

These tokens style the editor/Studio shell itself. They're intentionally
a single fixed dark palette ("Leonux") — the shell doesn't runtime-switch
themes.

## Theming *compiled documents*

Documents rendered through the engine (not the editor shell) use a
separate, fully dynamic system: the Phase 15 **Theme Engine**
(`src/theme/`). It ships three built-in palettes — Light, Dark, and Eye
Protection — as CSS custom properties on a `--zl-*` namespace, with
runtime switching and no reload required.

```js
import { createThemeEngine, applyTheme } from './src/theme/index.js';

const engine = createThemeEngine();
const { tokens, css } = engine.getTheme('dark');
applyTheme('eye-protection'); // swaps every --zl-* token live
```

See `ThemeEngine`, `ThemeSwitcher`, `ThemePackageBuilder` (for portable
`.zltheme` bundles), and `ThemeAccessibility` (WCAG AAA contrast
validation) in `src/theme/index.js` for the full API — this is the
supported way to add or customize a theme, not hand-written CSS files.
