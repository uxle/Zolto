/** Deep clone any JSON-serialisable value. */
export const deepClone = val => JSON.parse(JSON.stringify(val));
