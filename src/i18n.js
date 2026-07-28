/**
 * Zolto Basic Localization & i18n
 */

const locales = {
  en: {
    'error.syntax': 'Syntax error at line {line}: {msg}',
    'error.unknown_directive': 'Unknown directive: {name}',
    'warn.deprecated': 'Warning: {name} is deprecated.',
    'status.ready': 'Ready'
  }
};

let currentLocale = 'en';

export function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale;
  }
}

export function t(key, args = {}) {
  let str = locales[currentLocale]?.[key] || locales['en']?.[key] || key;
  for (const [k, v] of Object.entries(args)) {
    str = str.replace(new RegExp("\\\\{" + k + "\\\\}", 'g'), v);
  }
  return str;
}
