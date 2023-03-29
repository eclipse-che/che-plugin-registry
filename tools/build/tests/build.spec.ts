/**********************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import 'reflect-metadata';

import { CheEditorYaml, CheEditorsYaml } from '../src/editor/che-editors-yaml';

import { Build } from '../src/build';
import { CheEditorsAnalyzer } from '../src/editor/che-editors-analyzer';
import { CheEditorsMetaYamlGenerator } from '../src/editor/che-editors-meta-yaml-generator';
import { Container } from 'inversify';
import { Deferred } from '../src/util/deferred';
import { DigestImagesHelper } from '../src/meta-yaml/digest-images-helper';
import { ExternalImagesWriter } from '../src/meta-yaml/external-images-writer';
import { IndexWriter } from '../src/meta-yaml/index-writer';
import { MetaYamlWriter } from '../src/meta-yaml/meta-yaml-writer';
import { createSpinner } from 'nanospinner';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('fs-extra');

describe('Test Build', () => {
  let container: Container;

  const cheEditorsAnalyzerAnalyzeMock = jest.fn();
  const cheEditorsAnalyzer: any = {
    analyze: cheEditorsAnalyzerAnalyzeMock,
  };

  const metaYamlWriterWriteMock = jest.fn();
  const metaYamlWriter: any = {
    write: metaYamlWriterWriteMock,
  };

  const indexWriterWriteMock = jest.fn();
  const indexWriter: any = {
    write: indexWriterWriteMock,
  };

  const externalImagesWriterWriteMock = jest.fn();
  const externalImagesWriter: any = {
    write: externalImagesWriterWriteMock,
  };

  const digestImagesHelperUpdateImagesMock = jest.fn();
  const digestImagesHelper: any = {
    updateImages: digestImagesHelperUpdateImagesMock,
  };

  const metaYamlGeneratorComputeMock = jest.fn();

  const metaYamlEditorGeneratorComputeMock = jest.fn();
  const cheEditorMetaYamlGenerator: any = {
    compute: metaYamlEditorGeneratorComputeMock,
  };

  let build: Build;

  async function buildCheEditorYaml(): Promise<CheEditorYaml> {
    return {
      schemaVersion: '2.1.0',
      metadata: {
        name: 'ws-skeleton/eclipseide/4.9.0',
        displayName: 'Eclipse IDE',
        description: 'Eclipse running on the Web with Broadway',
        icon: 'https://cdn.freebiesupply.com/logos/large/2x/eclipse-11-logo-svg-vector.svg',
        attributes: {
          title: 'Eclipse IDE (in browser using Broadway) as editor for Eclipse Che',
          repository: 'https://github.com/ws-skeleton/che-editor-eclipseide/',
          firstPublicationDate: '2019-02-05',
        },
      },
      components: [
        {
          name: 'eclipse-ide',
          container: {
            image: 'docker.io/wsskeleton/eclipse-broadway',
            mountSources: true,
            memoryLimit: '2048M',
            endpoints: [
              {
                name: 'eclipse-ide',
                public: true,
                targetPort: 5000,
                attributes: {
                  protocol: 'http',
                  type: 'ide',
                },
              },
            ],
          },
        },
      ],
    };
  }

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind('string').toConstantValue('/fake-root-directory').whenTargetNamed('PLUGIN_REGISTRY_ROOT_DIRECTORY');
    container.bind('string').toConstantValue('/fake-root-directory/output').whenTargetNamed('OUTPUT_ROOT_DIRECTORY');
    container.bind('boolean').toConstantValue(false).whenTargetNamed('SKIP_DIGEST_GENERATION');
    container.bind('string[]').toConstantValue([]).whenTargetNamed('ARGUMENTS');

    container.bind(CheEditorsAnalyzer).toConstantValue(cheEditorsAnalyzer);
    container.bind(CheEditorsMetaYamlGenerator).toConstantValue(cheEditorMetaYamlGenerator);
    container.bind(MetaYamlWriter).toConstantValue(metaYamlWriter);
    container.bind(IndexWriter).toConstantValue(indexWriter);
    container.bind(DigestImagesHelper).toConstantValue(digestImagesHelper);
    container.bind(ExternalImagesWriter).toConstantValue(externalImagesWriter);

    container.bind(Build).toSelf().inSingletonScope();
    build = container.get(Build);
  });

  test('basics', async () => {
    // no id, so it will be computed

    const cheEditorPluginYaml = await buildCheEditorYaml();
    const cheEditorsYaml: CheEditorsYaml = {
      editors: [cheEditorPluginYaml],
    };
    cheEditorsAnalyzerAnalyzeMock.mockResolvedValueOnce(cheEditorsYaml);

    metaYamlGeneratorComputeMock.mockResolvedValueOnce([]);
    metaYamlEditorGeneratorComputeMock.mockResolvedValueOnce([]);

    await build.build();
    expect(cheEditorMetaYamlGenerator.compute).toHaveBeenCalled();

    expect(metaYamlWriter.write).toHaveBeenCalled();
    expect(indexWriter.write).toHaveBeenCalled();
    expect(digestImagesHelper.updateImages).toHaveBeenCalled();
  });

  test('succed task', async () => {
    const deferred = new Deferred();
    let currentValue = false;
    const task = createSpinner('my-task').start();
    build.updateTask(deferred.promise, task, () => (currentValue = true), 'error');
    expect(currentValue).toBeFalsy();
    deferred.resolve();
    await deferred.promise;
    expect(currentValue).toBeTruthy();
  });

  test('with a fail task', async () => {
    const deferred = new Deferred();
    let currentValue = false;
    const task = createSpinner('my-task').start();
    const spyTask = jest.spyOn(task, 'error');
    build.updateTask(deferred.promise, task, () => (currentValue = true), 'error');
    expect(currentValue).toBeFalsy();
    deferred.reject('rejecting');
    await expect(deferred.promise).rejects.toMatch('rejecting');
    expect(currentValue).toBeFalsy();
    expect(spyTask).toHaveBeenCalled();
    expect(spyTask.mock.calls[0][0]).toStrictEqual({ text: 'error' });
  });

  test('with a fail wrapIntoTask', async () => {
    const deferred = new Deferred();
    const task = createSpinner('my-task').start();
    const spyFailTask = jest.spyOn(task, 'error');
    const wrapTask = build.wrapIntoTask('This is my task', deferred.promise, task);
    deferred.reject('rejecting');
    await expect(wrapTask).rejects.toMatch('rejecting');
    expect(spyFailTask).toHaveBeenCalled();
    expect(spyFailTask.mock.calls[0][0]).toBeUndefined();
  });
});
