/********************************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import * as fs from 'fs-extra';
import * as jsyaml from 'js-yaml';

export interface CheTheiaPluginsFile {
  version: string;
  plugins: Array<CheTheiaPlugin>;
}

// struct for an entry in the che-theia-plugins.yaml file
export interface CheTheiaPlugin {
  id?: string;
  isClosedSource?: boolean;
  repository: {
    url: string;
    revision: string;
    directory?: string;
  };
  extension?: string;
  sidecar?: {
    directory?: string;
    name?: string;
    memoryLimit?: string;
    memoryRequest?: string;
    cpuLimit?: string;
    cpuRequest?: string;
  };
}

export async function readCheTheiaPlugins(): Promise<CheTheiaPlugin[]> {
  const cheTheiaPluginsFile = await fs.readFile('./../../che-theia-plugins.yaml', 'utf-8');
  try {
    const cheTheiaPlugins = <CheTheiaPluginsFile>jsyaml.safeLoad(cheTheiaPluginsFile);
    return cheTheiaPlugins.plugins;
  } catch (e) {
    throw new Error(`Error reading che-theia-plugins YAML file: ${e}`);
  }
}
