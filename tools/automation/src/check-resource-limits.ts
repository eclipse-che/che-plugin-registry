/********************************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import { exit } from 'process';

import { ResourceLimitsChecker } from './resource-limits-checker';

(async (): Promise<void> => {
  console.log('\n🔥 Checking plugins..\n');

  const checked = await new ResourceLimitsChecker().check();

  if (checked) {
    console.log('✅ Succeded\n');
  } else {
    exit(1);
  }
})();
