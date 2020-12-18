/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import * as fs from 'fs-extra';

import { Container } from 'inversify';
import { MetaYamlPluginInfo } from '../../src/meta-yaml/meta-yaml-plugin-info';
import { MetaYamlWriter } from '../../src/meta-yaml/meta-yaml-writer';

describe('Test MetaYamlWriter', () => {
  let container: Container;

  let metaPluginYaml: MetaYamlPluginInfo;
  let metaYamlWriter: MetaYamlWriter;

  beforeEach(() => {
    metaPluginYaml = {
      id: 'custom-publisher/custom-name',
      aliases: ['first/alias', 'second/alias'],
      publisher: 'my-publisher',
      name: 'my-name',
      version: 'my-version',
      type: 'VS Code extension',
      displayName: 'display-name',
      title: 'my-title',
      description: 'my-description',
      iconFile: '/fake-dir/icon.png',
      category: 'Programming Languages',
      repository: 'http://fake-repository',
      firstPublicationDate: '2019-01-01',
      latestUpdateDate: '2020-01-01',
      spec: {
        extensions: ['http://my-first.vsix'],
      },
    };
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind('string').toConstantValue('/fake-output').whenTargetNamed('OUTPUT_ROOT_DIRECTORY');

    container.bind(MetaYamlWriter).toSelf().inSingletonScope();
    metaYamlWriter = container.get(MetaYamlWriter);
  });

  test('basics', async () => {
    const fsCopyFileSpy = jest.spyOn(fs, 'copyFile');
    const fsEnsureDirSpy = jest.spyOn(fs, 'ensureDir');
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

    fsEnsureDirSpy.mockReturnValue();
    fsCopyFileSpy.mockReturnValue();
    fsWriteFileSpy.mockReturnValue();

    const metaYamlPlugins: MetaYamlPluginInfo[] = [metaPluginYaml];
    await metaYamlWriter.write(metaYamlPlugins);
    expect(fsCopyFileSpy).toHaveBeenCalledWith(
      '/fake-dir/icon.png',
      '/fake-output/v3/images/my-publisher-my-name-icon.png'
    );
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3/plugins');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(2, '/fake-output/v3/images');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(
      3,
      '/fake-output/v3/plugins/custom-publisher/custom-name/my-version'
    );
    const content = `apiVersion: v2
publisher: custom-publisher
name: custom-name
version: my-version
type: VS Code extension
displayName: display-name
title: my-title
description: my-description
icon: /v3/images/my-publisher-my-name-icon.png
category: Programming Languages
repository: 'http://fake-repository'
firstPublicationDate: '2019-01-01'
spec:
  extensions:
    - 'http://my-first.vsix'
`;
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(
      1,
      '/fake-output/v3/plugins/custom-publisher/custom-name/my-version/meta.yaml',
      content
    );
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(
      2,
      '/fake-output/v3/plugins/custom-publisher/custom-name/latest.txt',
      'my-version\n'
    );
    // check that alias is also being written (and alias is deprecated)
    const aliasContent = content
      .replace('custom-publisher', 'first')
      .replace('custom-name', 'alias')
      .replace('spec:\n', 'deprecate:\n  automigrate: true\n  migrateTo: custom-publisher/custom-name/latest\nspec:\n');
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(
      3,
      '/fake-output/v3/plugins/first/alias/my-version/meta.yaml',
      aliasContent
    );
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(4, '/fake-output/v3/plugins/first/alias/latest.txt', 'my-version\n');
  });

  test('default icon', async () => {
    const fsCopyFileSpy = jest.spyOn(fs, 'copyFile');
    const fsEnsureDirSpy = jest.spyOn(fs, 'ensureDir');
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

    fsEnsureDirSpy.mockReturnValue();
    fsCopyFileSpy.mockReturnValue();
    fsWriteFileSpy.mockReturnValue();
    delete metaPluginYaml.iconFile;
    delete metaPluginYaml.aliases;
    metaPluginYaml.disableLatest = true;
    const metaYamlPlugins: MetaYamlPluginInfo[] = [metaPluginYaml];
    await metaYamlWriter.write(metaYamlPlugins);
    // no copy of the icon
    expect(fsCopyFileSpy).toHaveBeenCalledTimes(0);
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3/plugins');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(2, '/fake-output/v3/images');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(
      3,
      '/fake-output/v3/plugins/custom-publisher/custom-name/my-version'
    );
    // icon is the default one
    const content = `apiVersion: v2
publisher: custom-publisher
name: custom-name
version: my-version
type: VS Code extension
displayName: display-name
title: my-title
description: my-description
icon: /v3/images/eclipse-che-logo.png
category: Programming Languages
repository: 'http://fake-repository'
firstPublicationDate: '2019-01-01'
spec:
  extensions:
    - 'http://my-first.vsix'
`;

    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(
      1,
      '/fake-output/v3/plugins/custom-publisher/custom-name/my-version/meta.yaml',
      content
    );
    // no version written with disable Latest
    expect(fsWriteFileSpy).toHaveBeenCalledTimes(1);
  });
});
