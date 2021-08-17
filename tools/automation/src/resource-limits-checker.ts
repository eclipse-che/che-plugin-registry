/********************************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import { CheTheiaPlugin, readCheTheiaPlugins } from './che-theia-plugins';

/**
 * Refer the link below to get more information about container resources
 *    https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#meaning-of-memory
 */

export const cpuRegex = /^(([0-9]*$)|([0-9]+.?[0-9]+$)|([0-9]+m$))$/;

export const memoryRegex = /^(([0-9]*$)|([0-9]+(k|Ki|M|Mi|G|Gi|T|Ti|P|Pi|E|Ei)$))$/;

export interface CheckResult {
  missing?: string[];
  invalid?: string[];
}

export class ResourceLimitsChecker {
  validate(plugin: CheTheiaPlugin): CheckResult | undefined {
    if (plugin.sidecar) {
      const missing: string[] = [];
      const invalid: string[] = [];

      if (!plugin.sidecar.cpuLimit) {
        missing.push('cpuLimit');
      } else {
        if (!plugin.sidecar.cpuLimit.match(cpuRegex)) {
          invalid.push('cpuLimit');
        }
      }

      if (!plugin.sidecar.cpuRequest) {
        missing.push('cpuRequest');
      } else {
        if (!plugin.sidecar.cpuRequest.match(cpuRegex)) {
          invalid.push('cpuRequest');
        }
      }

      if (!plugin.sidecar.memoryLimit) {
        missing.push('memoryLimit');
      } else {
        if (!plugin.sidecar.memoryLimit.match(memoryRegex)) {
          invalid.push('memoryLimit');
        }
      }

      if (!plugin.sidecar.memoryRequest) {
        missing.push('memoryRequest');
      } else {
        if (!plugin.sidecar.memoryRequest.match(memoryRegex)) {
          invalid.push('memoryRequest');
        }
      }

      return {
        missing: missing.length ? missing : undefined,
        invalid: invalid.length ? invalid : undefined,
      };
    }

    return undefined;
  }

  async check(): Promise<boolean> {
    const plugins = await readCheTheiaPlugins();

    let success = true;

    plugins.forEach(plugin => {
      if (!plugin.extension) {
        console.log('   ❌ ERROR: extension is required\n');
        success = false;
        return;
      }

      const result = this.validate(plugin);

      if (result && (result.missing || result.invalid)) {
        success = false;

        console.log(`   ❌ ${plugin.extension}\n`);

        if (result.missing) {
          console.log(`         missing ${result.missing.join(', ')}\n`);
        }

        if (result.invalid) {
          console.log(`         invalid ${result.invalid.join(', ')}\n`);
        }
      }
    });

    return success;
  }
}
