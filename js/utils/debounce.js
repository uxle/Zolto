/** @param {Function} fn @param {number} ms @returns {Function} */
export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
