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

import { CheTheiaPluginYaml, CheTheiaPluginsYaml } from '../src/plugin/che-theia-plugins-yaml';

import { Build } from '../src/build';
import { CheTheiaPluginAnalyzerMetaInfo } from '../src/plugin/che-theia-plugin-analyzer-meta-info';
import { CheTheiaPluginsAnalyzer } from '../src/plugin/che-theia-plugins-analyzer';
import { Container } from 'inversify';
import { FeaturedAnalyzer } from '../src/featured/featured-analyzer';
import { FeaturedWriter } from '../src/featured/featured-writer';
import { MetaYamlGenerator } from '../src/meta-yaml/meta-yaml-generator';
import { MetaYamlWriter } from '../src/meta-yaml/meta-yaml-writer';
import { RecommendationsAnalyzer } from '../src/recommendations/recommendations-analyzer';
import { RecommendationsWriter } from '../src/recommendations/recommendations-writer';
import { VsixUrlAnalyzer } from '../src/extensions/vsix-url-analyzer';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('fs-extra');

describe('Test Build', () => {
  let container: Container;

  const cheTheiaPluginsAnalyzerAnalyzeMock = jest.fn();
  const cheTheiaPluginsAnalyzer: any = {
    analyze: cheTheiaPluginsAnalyzerAnalyzeMock,
  };

  const vsixUrlAnalyzerAnalyzeMock = jest.fn();
  const vsixUrlAnalyzer: any = {
    analyze: vsixUrlAnalyzerAnalyzeMock,
  };

  const featuredAnalyzerGenerateMock = jest.fn();
  const featuredAnalyzer: any = {
    generate: featuredAnalyzerGenerateMock,
  };

  const featuredWriterWriteReportMock = jest.fn();
  const featuredWriter: any = {
    writeReport: featuredWriterWriteReportMock,
  };

  const metaYamlWriterWriteMock = jest.fn();
  const metaYamlWriter: any = {
    write: metaYamlWriterWriteMock,
  };

  const recommendationsAnalyzerGenerateMock = jest.fn();
  const recommendationsAnalyzer: any = {
    generate: recommendationsAnalyzerGenerateMock,
  };

  const recommendationsWriterWriteRecommendationsMock = jest.fn();
  const recommendationsWriter: any = {
    writeRecommendations: recommendationsWriterWriteRecommendationsMock,
  };

  const metaYamlGeneratorComputeMock = jest.fn();
  const metaYamlGenerator: any = {
    compute: metaYamlGeneratorComputeMock,
  };

  let build: Build;

  async function buildCheMetaPluginYaml(): Promise<CheTheiaPluginYaml> {
    return {
      featured: false,
      sidecar: { image: 'fake-image' },
      repository: {
        url: 'http://fake-repository',
        revision: 'main',
      },
      extensions: ['https://my-fake.vsix'],
    };
  }

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind('string').toConstantValue('/fake-root-directory').whenTargetNamed('PLUGIN_REGISTRY_ROOT_DIRECTORY');
    container.bind('string[]').toConstantValue([]).whenTargetNamed('ARGUMENTS');
    container.bind(FeaturedAnalyzer).toConstantValue(featuredAnalyzer);
    container.bind(FeaturedWriter).toConstantValue(featuredWriter);
    container.bind(RecommendationsAnalyzer).toConstantValue(recommendationsAnalyzer);
    container.bind(RecommendationsWriter).toConstantValue(recommendationsWriter);
    container.bind(CheTheiaPluginsAnalyzer).toConstantValue(cheTheiaPluginsAnalyzer);
    container.bind(VsixUrlAnalyzer).toConstantValue(vsixUrlAnalyzer);

    container.bind(MetaYamlGenerator).toConstantValue(metaYamlGenerator);
    container.bind(MetaYamlWriter).toConstantValue(metaYamlWriter);

    container.bind(Build).toSelf().inSingletonScope();
    build = container.get(Build);
  });

  test('basics', async () => {
    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    // no id, so it will be computed

    const packageJson: any = {
      publisher: 'foobar-Publisher',
      name: 'ACuStOmName',
    };

    vsixUrlAnalyzerAnalyzeMock.mockImplementation((vsixInfo: any) => {
      vsixInfo.packageJson = packageJson;
    });
    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await build.build();
    expect(metaYamlGenerator.compute).toBeCalled();
    const computeCall = metaYamlGeneratorComputeMock.mock.calls[0];
    // computed id should be all lowercase
    expect(computeCall[0][0].id).toBe('foobar-publisher/acustomname');

    expect(recommendationsWriter.writeRecommendations).toBeCalled();
    expect(vsixUrlAnalyzer.analyze).toBeCalled();
    expect(featuredAnalyzer.generate).toBeCalled();
    expect(featuredWriter.writeReport).toBeCalled();
    expect(recommendationsAnalyzer.generate).toBeCalled();
    expect(recommendationsWriter.writeRecommendations).toBeCalled();
  });

  test('basics without package.json', async () => {
    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await expect(build.build()).rejects.toThrow('Unable to find a package.json file for extension');
  });

  test('basics with no extensions', async () => {
    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    delete (cheTheiaPluginYaml as any).extensions;
    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await expect(build.build()).rejects.toThrow('Unable to find a package.json file for extension');
  });

  test('basics with empty vsixInfos', async () => {
    const analyzeCheTheiaPluginSpy = jest.spyOn(build, 'analyzeCheTheiaPlugin');
    analyzeCheTheiaPluginSpy.mockImplementation(async (cheTheiaPlugin: CheTheiaPluginAnalyzerMetaInfo) =>
      cheTheiaPlugin.vsixInfos.clear()
    );

    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await expect(build.build()).rejects.toThrow('Unable to find a package.json file for extension');
  });

  test('basics without publisher', async () => {
    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    // no id, so it will be computed
    const packageJson: any = {
      name: 'ACuStOmName',
    };

    vsixUrlAnalyzerAnalyzeMock.mockImplementation((vsixInfo: any) => {
      vsixInfo.packageJson = packageJson;
    });
    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await expect(build.build()).rejects.toThrow('Unable to find a publisher field in package.json file for extension');
  });

  test('basics without name', async () => {
    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    // no id, so it will be computed
    const packageJson: any = {
      publisher: 'ACuStOmName',
    };

    vsixUrlAnalyzerAnalyzeMock.mockImplementation((vsixInfo: any) => {
      vsixInfo.packageJson = packageJson;
    });
    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await expect(build.build()).rejects.toThrow('Unable to find a name field in package.json file for extension');
  });

  test('basics with id', async () => {
    const cheTheiaPluginYaml = await buildCheMetaPluginYaml();
    cheTheiaPluginYaml.id = 'my/id';

    const cheTheiaPluginsYaml: CheTheiaPluginsYaml = {
      plugins: [cheTheiaPluginYaml],
    };

    cheTheiaPluginsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheTheiaPluginsYaml);

    await build.build();
    expect(metaYamlGenerator.compute).toBeCalled();
    const computeCall = metaYamlGeneratorComputeMock.mock.calls[0];
    expect(computeCall[0][0].id).toBe('my/id');

    expect(recommendationsWriter.writeRecommendations).toBeCalled();
    expect(vsixUrlAnalyzer.analyze).toBeCalled();
    expect(featuredAnalyzer.generate).toBeCalled();
    expect(featuredWriter.writeReport).toBeCalled();
    expect(recommendationsAnalyzer.generate).toBeCalled();
    expect(recommendationsWriter.writeRecommendations).toBeCalled();
  });
});
