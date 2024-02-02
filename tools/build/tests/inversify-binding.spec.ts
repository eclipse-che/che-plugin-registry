/**********************************************************************
 * Copyright (c) 2020-2024 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import 'reflect-metadata';

import * as fs from 'fs-extra';

import { CheEditorsAnalyzer } from '../src/editor/che-editors-analyzer';
import { Container } from 'inversify';
import { DigestImagesHelper } from '../src/devfle-yaml/digest-images-helper';
import { ExternalImagesWriter } from '../src/devfle-yaml/external-images-writer';
import { IndexWriter } from '../src/devfle-yaml/index-writer';
import { InversifyBinding } from '../src/inversify-binding';
import { DevfileYamlWriter } from '../src/devfle-yaml/devfile-yaml-writer';
import { RegistryHelper } from '../src/registry/registry-helper';

describe('Test InversifyBinding', () => {
  const mockedArgv: string[] = ['dummy', 'dummy'];
  const originalProcessArgv = process.argv;

  beforeEach(() => {
    mockedArgv.length = 2;
    process.argv = mockedArgv;
    const fsMkdirsSpy = jest.spyOn(fs, 'mkdirs');
    fsMkdirsSpy.mockReturnValue();
  });
  afterEach(() => (process.argv = originalProcessArgv));

  test('default', async () => {
    const inversifyBinding = new InversifyBinding();
    const container: Container = await inversifyBinding.initBindings();

    expect(inversifyBinding).toBeDefined();

    // check editor module
    expect(container.get(CheEditorsAnalyzer)).toBeDefined();

    // check meta module
    expect(await container.getAsync(DigestImagesHelper)).toBeDefined();
    expect(container.get(IndexWriter)).toBeDefined();
    expect(container.get(DevfileYamlWriter)).toBeDefined();
    expect(container.get(ExternalImagesWriter)).toBeDefined();

    // check registry module
    expect(await container.getAsync(RegistryHelper)).toBeDefined();
  });

  test('custom', async () => {
    const myCustomRootDir = '/tmp/root';
    const myCustomOutputDir = '/tmp/foo';
    mockedArgv.push(`--root-folder:${myCustomRootDir}`);
    mockedArgv.push(`--output-folder:${myCustomOutputDir}`);
    mockedArgv.push('--foo-arg:bar');
    mockedArgv.push('--embed-vsix:true');
    mockedArgv.push('--skip-digest-generation:true');
    const inversifyBinding = new InversifyBinding();
    const container: Container = await inversifyBinding.initBindings();

    const rootDir = container.getNamed('string', 'PLUGIN_REGISTRY_ROOT_DIRECTORY');
    const outputDir = container.getNamed('string', 'OUTPUT_ROOT_DIRECTORY');
    const embedded = container.getNamed('boolean', 'EMBED_VSIX');
    const skipDigests = container.getNamed('boolean', 'SKIP_DIGEST_GENERATION');

    expect(rootDir).toEqual(myCustomRootDir);
    expect(outputDir).toEqual(myCustomOutputDir);
    expect(embedded).toBeTruthy();
    expect(skipDigests).toBeTruthy();
  });
});
