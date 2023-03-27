/**********************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

export interface MetaYamlPluginInfo {
  id: string;
  publisher: string;
  name: string;
  version: string;
  type: 'Che Editor';
  displayName: string;
  title: string;
  description: string;
  iconFile?: string;
  category: 'Editor';
  repository: string;
  firstPublicationDate: string;
  latestUpdateDate: string;
  aliases?: string[];
  skipMetaYaml: boolean;
  skipIndex: boolean;
  spec: {
    containers?: [{ image: string; command?: string[]; args?: string[]; env?: { name: string; value: string }[] }];
    initContainers?: [{ image: string }];
    extensions: string[];
  };
  // do not write latest alias
  disableLatest?: boolean;
}
