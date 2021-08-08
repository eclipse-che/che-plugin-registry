/********************************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import * as fs from 'fs-extra';
import * as jsyaml from 'js-yaml';

import { exit } from 'process';

import { CheTheiaPlugin, readCheTheiaPlugins } from './che-theia-plugins';

export class ResourceLimitsCheck {
  validate(plugin: CheTheiaPlugin): string | undefined {
    if (plugin.sidecar) {
      const missing: string[] = [];

      if (!plugin.sidecar.cpuLimit) {
        missing.push('cpuLimit');
      } else {
        // validate cpuLimit
      }

      if (!plugin.sidecar.cpuRequest) {
        missing.push('cpuRequest');
      } else {
        // validate cpuRequest
      }

      if (!plugin.sidecar.memoryLimit) {
        missing.push('memoryLimit');
      } else {
        // validate memoryLimit
      }

      if (!plugin.sidecar.memoryRequest) {
        missing.push('memoryRequest');
      } else {
        // validate memoryRequest
      }

      if (missing.length) {
        return missing.join(', ');
      }
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

      if (plugin.sidecar) {
        const missing = this.validate(plugin);

        if (missing) {
          console.log(`   ❌ ${plugin.extension}\n`);
          console.log(`         missing ${missing}\n`);
          success = false;
        }
      }
    });

    return success;
  }
}

(async (): Promise<void> => {
  console.log('\n🔥 Checking plugins..\n');

  const checked = await new ResourceLimitsCheck().check();

  if (checked) {
    console.log('✅ Succeded\n');
  } else {
    exit(1);
  }
})();
