/**
 * Zolto Ecosystem Validator — Phase 14
 *
 * Static validation for merge requests, access control, package formats,
 * and workspace configurations.
 */

import { EcosystemDiagnostics } from './diagnostics.js';

export class EcosystemValidator {
  validateMergeRequest(mr) {
    const diag = new EcosystemDiagnostics();
    if (!mr || typeof mr !== 'object') {
      diag.error('E1401', 'Merge request is null or invalid object');
      return diag;
    }
    if (!mr.sourceBranch || !mr.targetBranch) {
      diag.error('E1402', 'Merge request is missing source or target branch');
    }
    if (mr.sourceBranch === mr.targetBranch) {
      diag.warn('W1401', 'Merge request source and target branch are identical');
    }
    return diag;
  }

  validateWorkspace(ws) {
    const diag = new EcosystemDiagnostics();
    if (!ws || !ws.name) {
      diag.warn('W1402', 'Workspace is missing a name');
    }
    return diag;
  }
}
