/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

export interface CheTheiaPluginSidecarEndpointYaml {
  name: string;
  public?: boolean;
  targetPort?: number;
  attributes: { [key: string]: string };
}

export interface CheTheiaPluginSidecarEnvYaml {
  name: string;
  value: string;
}

export interface CheTheiaPluginSidecarVolumeMountYaml {
  name: string;
  path: string;
}

export interface AbsCheTheiaPluginSidecarYaml {
  name?: string;
  mountSources?: boolean;
  memoryRequest?: string;
  memoryLimit?: string;
  cpuRequest?: string;
  cpuLimit?: string;
  volumeMounts?: CheTheiaPluginSidecarVolumeMountYaml[];
  endpoints?: CheTheiaPluginSidecarEndpointYaml[];
  env?: CheTheiaPluginSidecarEnvYaml[];
}

export interface CheTheiaPluginSidecarDirectoryYaml extends AbsCheTheiaPluginSidecarYaml {
  directory: string;
}

export interface CheTheiaPluginSidecarImageYaml extends AbsCheTheiaPluginSidecarYaml {
  image: string;
}

export interface CheTheiaPluginYaml {
  id?: string;
  featured?: boolean;
  aliases?: string[];
  sidecar?: CheTheiaPluginSidecarDirectoryYaml | CheTheiaPluginSidecarImageYaml;
  repository: {
    url: string;
    revision: string;
  };
  extensions: string[];
}

export interface CheTheiaPluginsYaml {
  plugins: CheTheiaPluginYaml[];
}
