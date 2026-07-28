/**
 * Zolto Plugin Lifecycle State Machine — Phase 12
 *
 * Manages plugin state transitions:
 *   unloaded → loaded → initialized → registered → active → suspended → destroyed
 */

import { PLUGIN_LIFECYCLE_STATES } from './ast.js';

export class PluginInstance {
  constructor(manifest, pluginModule = {}, permissionManager = null) {
    this.manifest          = manifest;
    this.pluginModule      = pluginModule;
    this.permissionManager = permissionManager;
    this.state             = 'unloaded';
    this.errors            = [];
  }

  /**
   * Transition state if valid.
   * @param {string} newState
   */
  _setState(newState) {
    if (PLUGIN_LIFECYCLE_STATES.includes(newState)) {
      this.state = newState;
    }
  }

  load() {
    if (this.state !== 'unloaded') return this.state;
    this._setState('loaded');
    return this.state;
  }

  initialize(context = {}) {
    if (this.state !== 'loaded') this.load();
    try {
      if (typeof this.pluginModule.initialize === 'function') {
        this.pluginModule.initialize(context);
      }
      this._setState('initialized');
    } catch (err) {
      this.errors.push(err);
    }
    return this.state;
  }

  register(api) {
    if (this.state !== 'initialized') this.initialize({});
    try {
      if (typeof this.pluginModule.register === 'function') {
        this.pluginModule.register(api);
      }
      this._setState('registered');
    } catch (err) {
      this.errors.push(err);
    }
    return this.state;
  }

  activate() {
    if (this.state === 'registered' || this.state === 'suspended') {
      try {
        if (typeof this.pluginModule.activate === 'function') {
          this.pluginModule.activate();
        }
        this._setState('active');
      } catch (err) {
        this.errors.push(err);
      }
    }
    return this.state;
  }

  suspend() {
    if (this.state === 'active') {
      try {
        if (typeof this.pluginModule.suspend === 'function') {
          this.pluginModule.suspend();
        }
        this._setState('suspended');
      } catch (err) {
        this.errors.push(err);
      }
    }
    return this.state;
  }

  unload() {
    try {
      if (typeof this.pluginModule.unload === 'function') {
        this.pluginModule.unload();
      }
    } catch (err) {
      this.errors.push(err);
    }
    this._setState('unloaded');
    return this.state;
  }

  destroy() {
    this.unload();
    this._setState('destroyed');
    return this.state;
  }
}
