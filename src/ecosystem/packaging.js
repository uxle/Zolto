/**
 * Zolto Project Package Builder — Phase 14
 *
 * Packages Zolto project documents, themes, assets, and manifests into
 * portable, versioned `ProjectPackage` archives.
 */

import { createProjectPackage } from './ast.js';

export class PackageBuilder {
  /**
   * Create a project package archive node.
   * @param {string} name Package name
   * @param {string} version Version string
   * @param {Array<{ path: string, content: string }>} files List of file entries
   * @param {object} [metadata]
   * @returns {object} ProjectPackage AST node
   */
  buildPackage(name, version = '1.0.0', files = [], metadata = {}) {
    return createProjectPackage(name, version, { files, metadata });
  }
}
