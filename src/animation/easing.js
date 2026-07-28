/**
 * Zolto Animation Easing System — Phase 11
 *
 * Validates easing functions, converts Zolto easing tokens to CSS values,
 * and provides motion token resolution.
 */

// ─── Built-in easing values ───────────────────────────────────────────────────

export const BUILTIN_EASINGS = Object.freeze({
  'linear':       'linear',
  'ease':         'ease',
  'ease-in':      'ease-in',
  'ease-out':     'ease-out',
  'ease-in-out':  'ease-in-out',
  // Named shortcuts
  'standard':     'cubic-bezier(0.2, 0, 0, 1)',
  'decelerate':   'cubic-bezier(0, 0, 0.2, 1)',
  'accelerate':   'cubic-bezier(0.4, 0, 1, 1)',
  'sharp':        'cubic-bezier(0.4, 0, 0.6, 1)',
  'spring':       'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'bounce':       'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'overshoot':    'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'smooth':       'cubic-bezier(0.45, 0, 0.55, 1)',
});

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true if value is a valid CSS easing / Zolto easing name.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEasing(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (BUILTIN_EASINGS[v]) return true;
  if (/^cubic-bezier\(\s*[\d.+-]+\s*,\s*[\d.+-]+\s*,\s*[\d.+-]+\s*,\s*[\d.+-]+\s*\)$/.test(v)) return true;
  if (/^steps\(\s*\d+\s*(?:,\s*(?:start|end|jump-start|jump-end|jump-none|jump-both)\s*)?\)$/.test(v)) return true;
  return false;
}

/**
 * Convert a Zolto easing name or CSS easing to a valid CSS easing value.
 * Falls back to 'ease' for unknown values.
 * @param {string} value
 * @returns {string}
 */
export function resolveEasing(value) {
  if (!value) return 'ease';
  const v = String(value).trim();
  if (BUILTIN_EASINGS[v]) return BUILTIN_EASINGS[v];
  if (isValidEasing(v)) return v;
  return 'ease';
}

// ─── Duration parsing ─────────────────────────────────────────────────────────

const DURATION_RE = /^(\d+(?:\.\d+)?)(ms|s)?$/;

/**
 * Parse a duration string to milliseconds.
 * @param {string|number} value  '300', '300ms', '0.3s', 300
 * @returns {number}  milliseconds
 */
export function parseDuration(value) {
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  if (!value) return 300;
  const s = String(value).trim();
  const m = DURATION_RE.exec(s);
  if (!m) return 300;
  const n = parseFloat(m[1]);
  if (m[2] === 's') return Math.round(n * 1000);
  return Math.round(n);
}

/**
 * Check if a duration value is valid.
 * @param {string|number} value
 * @returns {boolean}
 */
export function isValidDuration(value) {
  if (typeof value === 'number') return isFinite(value) && value >= 0;
  if (!value) return false;
  return DURATION_RE.test(String(value).trim());
}
