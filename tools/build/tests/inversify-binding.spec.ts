/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
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
import { CheEditorsMetaYamlGenerator } from '../src/editor/che-editors-meta-yaml-generator';
import { ChePluginsAnalyzer } from '../src/che-plugin/che-plugins-analyzer';
import { ChePluginsMetaYamlGenerator } from '../src/che-plugin/che-plugins-meta-yaml-generator';
import { CheTheiaPluginsAnalyzer } from '../src/che-theia-plugin/che-theia-plugins-analyzer';
import { CheTheiaPluginsMetaYamlGenerator } from '../src/che-theia-plugin/che-theia-plugins-meta-yaml-generator';
import { Container } from 'inversify';
import { FeaturedAnalyzer } from '../src/featured/featured-analyzer';
import { FeaturedWriter } from '../src/featured/featured-writer';
import { InversifyBinding } from '../src/inversify-binding';
import { MetaYamlWriter } from '../src/meta-yaml/meta-yaml-writer';
import { RecommendationsAnalyzer } from '../src/recommendations/recommendations-analyzer';
import { RecommendationsWriter } from '../src/recommendations/recommendations-writer';
import { VsixDownload } from '../src/extensions/vsix-download';
import { VsixReadInfo } from '../src/extensions/vsix-read-info';
import { VsixUnpack } from '../src/extensions/vsix-unpack';
import { VsixUrlAnalyzer } from '../src/extensions/vsix-url-analyzer';

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

    // check che-theia-plugin module
    expect(container.get(CheTheiaPluginsAnalyzer)).toBeDefined();
    expect(container.get(CheTheiaPluginsMetaYamlGenerator)).toBeDefined();

    // check editor module
    expect(container.get(CheEditorsAnalyzer)).toBeDefined();
    expect(container.get(CheEditorsMetaYamlGenerator)).toBeDefined();

    // check extension module
    expect(container.get(VsixDownload)).toBeDefined();
    expect(container.get(VsixReadInfo)).toBeDefined();
    expect(container.get(VsixUnpack)).toBeDefined();
    expect(container.get(VsixUrlAnalyzer)).toBeDefined();

    // check featured module
    expect(container.get(FeaturedAnalyzer)).toBeDefined();
    expect(container.get(FeaturedWriter)).toBeDefined();

    // check meta module
    expect(container.get(MetaYamlWriter)).toBeDefined();

    // check plugin module
    expect(container.get(ChePluginsAnalyzer)).toBeDefined();
    expect(container.get(ChePluginsMetaYamlGenerator)).toBeDefined();

    // check recommendations module
    expect(container.get(RecommendationsAnalyzer)).toBeDefined();
    expect(container.get(RecommendationsWriter)).toBeDefined();
  });

  test('custom', async () => {
    const myCustomOutputDir = '/tmp/foo';
    mockedArgv.push(`--output-folder:${myCustomOutputDir}`);
    mockedArgv.push('--foo-arg:bar');
    const inversifyBinding = new InversifyBinding();
    const container: Container = await inversifyBinding.initBindings();

    const outputDir = container.getNamed('string', 'OUTPUT_ROOT_DIRECTORY');

    expect(outputDir).toEqual(myCustomOutputDir);
  });
});
