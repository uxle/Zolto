/**
 * Zolto Runtime Theme Switcher — Phase 15
 *
 * Provides runtime theme toggling and CSS injection helpers.
 */

import { createThemeState } from './ast.js';

export class ThemeSwitcher {
  constructor(engine) {
    this.engine = engine;
  }

  switchTheme(name) {
    const activeName = this.engine.setActiveTheme(name);
    const activeTheme = this.engine.getActiveTheme();
    const state = createThemeState(activeName, activeTheme.mode);
    const css = this.engine.generateCssCustomProperties(activeName);

    return {
      state,
      css,
      activeName,
      activeTheme,
    };
  }
}
