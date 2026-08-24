# Creating Themes

Zolto themes are created and registered through the Phase 15
**Theme Engine** (`src/theme/`), not as hand-authored CSS files. The
old `css/themes/*.css` file-per-theme pattern documented here
previously was never wired up (no `data-theme` attribute was ever set
on anything, and the files weren't loaded by `index.html`) and has
been removed along with the rest of that dead tree.

## Defining a theme

A theme is a `Theme` AST node — build one with `createTheme(name, mode,
tokens)` from `src/theme/ast.js`, where `tokens` is a flat object keyed
by the constants in `TOKEN_KEYS` (`src/theme/tokens.js`, `--zl-*`
namespace: backgrounds, text, borders, spacing, radius, shadows,
motion):

```js
import { ThemeEngine } from './src/theme/index.js';
import { createTheme } from './src/theme/ast.js';
import { TOKEN_KEYS } from './src/theme/tokens.js';

const engine = new ThemeEngine(); // light/dark/eyeprotection pre-registered

engine.registerTheme(createTheme('midnight', 'dark', {
  [TOKEN_KEYS.BG_CANVAS]:    '#0d0f14',
  [TOKEN_KEYS.BG_SURFACE]:   '#171a21',
  [TOKEN_KEYS.TEXT_PRIMARY]: '#e6e8ec',
  // ...remaining TOKEN_KEYS
}));
```

## Validating accessibility

Run new themes through `ThemeAccessibility` before shipping them —
`isWcagAaa` checks a foreground/background pair against the WCAG AAA
contrast threshold:

```js
import { ThemeAccessibility } from './src/theme/index.js';

const a11y = new ThemeAccessibility();
const theme = engine.getTheme('midnight');
const ok = a11y.isWcagAaa(theme.tokens[TOKEN_KEYS.TEXT_PRIMARY], theme.tokens[TOKEN_KEYS.BG_CANVAS]);
```

## Applying and switching at runtime

```js
import { ThemeSwitcher } from './src/theme/index.js';

const switcher = new ThemeSwitcher(engine);
const { css, activeName } = switcher.switchTheme('midnight');
document.querySelector('#zl-theme-vars').textContent = css; // injects --zl-* custom properties live, no reload
```

## Packaging for distribution

Use `ThemePackageBuilder.buildPackage(name, version, themes, metadata)`
to bundle one or more themes into a portable `.zltheme` package that
other Zolto installs can import.
