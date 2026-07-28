export const isString  = v => typeof v === 'string';
export const isNumber  = v => typeof v === 'number' && !Number.isNaN(v);
export const isBoolean = v => typeof v === 'boolean';
export const isArray   = Array.isArray;
export const isObject  = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isNull    = v => v === null;
export const isDefined = v => v !== undefined && v !== null;
