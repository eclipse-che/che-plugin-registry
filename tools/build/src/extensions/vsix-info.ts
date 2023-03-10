/**********************************************************************
 * Copyright (c) 2020-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

/**
 * Describe information about a vsix
 */
export interface VsixInfo {
  uri: string;
  downloadedArchive?: string;
  unpackedArchive?: string;
  creationDate?: string;
  unpackedExtensionRootDir?: string;
  packageJson?: VsixPackageJson;
  packageNlsJson?: { [key: string]: string };
}

export type VsixCategory =
  | 'Programming Languages'
  | 'Snippets'
  | 'Linters'
  | 'Themes'
  | 'Debuggers'
  | 'Formatters'
  | 'Keymaps'
  | 'SCM Providers'
  | 'Other'
  | 'Extension Packs'
  | 'Language Packs'
  | 'Data Science'
  | 'Machine Learning'
  | 'Visualization'
  | 'Notebooks';

export interface VsixPackageJsonContributesLanguage {
  id: string;
  extensions: string[];
  aliases: string[];
}
export interface VsixPackageJsonContributes {
  languages: VsixPackageJsonContributesLanguage[];
}
export interface VsixPackageJson {
  activationEvents: string[];
  contributes: VsixPackageJsonContributes;
  categories: VsixCategory[];
  name?: string;
  publisher?: string;
  version?: string;
  icon?: string;
  displayName?: string;
  description?: string;
  extensionDependencies?: string[];
  repository?: {
    url?: string;
  };
}
