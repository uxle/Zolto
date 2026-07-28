/** Tiny typed event emitter. */
export class EventEmitter {
  constructor() { this._map = new Map(); }
  on(event, fn)  { (this._map.get(event) ?? this._map.set(event, new Set()).get(event)).add(fn); return this; }
  off(event, fn) { this._map.get(event)?.delete(fn); return this; }
  emit(event, ...args) { this._map.get(event)?.forEach(fn => fn(...args)); }
}
