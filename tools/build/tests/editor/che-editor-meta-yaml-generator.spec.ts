/**********************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import { CheEditorMetaInfo } from '../../src/editor/che-editors-meta-info';
import { CheEditorsMetaYamlGenerator } from '../../src/editor/che-editors-meta-yaml-generator';
import { Container } from 'inversify';
import { ContainerHelper } from '../../src/common/container-helper';
import { EndpointsHelper } from '../../src/common/endpoints-helper';
import { VolumeMountHelper } from '../../src/common/volume-mount-helper';

describe('Test ChePluginsMetaYamlGenerator', () => {
  let container: Container;

  let cheEditorsMetaYamlGenerator: CheEditorsMetaYamlGenerator;
  const originalConsoleWarn: any = console.warn;
  const originalConsoleError: any = console.error;

  async function generateEditorMetaInfo(id: string): Promise<CheEditorMetaInfo> {
    const cheEditor: CheEditorMetaInfo = {
      schemaVersion: '2.1.0',
      metadata: {
        displayName: 'VS Code - Open Source',
        description: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che',
        icon: 'https://raw.githubusercontent.com/che-incubator/che-code/main/code/resources/server/code-512.png?sanitize=true',
        name: id,
        attributes: {
          version: '5.7.0',
          title: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che',
          repository: 'https://github.com/che-incubator/che-code',
          firstPublicationDate: '2019-03-07',
        },
      },
      commands: [{ id: 'init-container-command', apply: { component: 'remote-runtime-injector' } }],
      events: {
        preStart: ['init-container-command'],
      },
      components: [
        {
          name: 'che-code-runtime-description',
          container: {
            image: 'quay.io/devfile/universal-developer-image:latest',
            env: [
              {
                name: 'HOSTED_PLUGIN_HOSTNAME',
                value: '0.0.0.0',
              },
              {
                name: 'HOSTED_PLUGIN_PORT',
                value: '3130',
              },
            ],
            volumeMounts: [
              {
                name: 'checode',
                path: '/checode',
              },
            ],
            mountSources: true,
            memoryLimit: '512M',
            endpoints: [
              {
                name: 'che-code',
                public: true,
                targetPort: 13131,
                attributes: {
                  protocol: 'http',
                  type: 'ide',
                },
              },
              {
                name: 'code-redirect-1',
                public: true,
                targetPort: 13131,
                attributes: {
                  protocol: 'http',
                },
              },
              {
                name: 'code-redirect-2',
                public: true,
                targetPort: 13132,
                attributes: {
                  protocol: 'http',
                },
              },
              {
                name: 'code-redirect-3',
                public: true,
                targetPort: 13133,
                attributes: {
                  protocol: 'http',
                },
              },
            ],
          },
        },
        {
          name: 'che-code-injector',
          container: {
            image: 'quay.io/che-incubator/che-code:latest',
            volumeMounts: [
              {
                name: 'remote-endpoint',
                path: '/remote-endpoint',
              },
            ],
            env: [
              {
                name: 'PLUGIN_REMOTE_ENDPOINT_EXECUTABLE',
                value: '/remote-endpoint/plugin-remote-endpoint',
              },
              {
                name: 'REMOTE_ENDPOINT_VOLUME_NAME',
                value: 'remote-endpoint',
              },
            ],
          },
        },
        {
          name: 'remote-endpoint',
          volume: { ephemeral: true },
        },
      ],
    };
    return cheEditor;
  }

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
    container = new Container();
    container.bind(CheEditorsMetaYamlGenerator).toSelf().inSingletonScope();
    container.bind(VolumeMountHelper).toSelf().inSingletonScope();
    container.bind(ContainerHelper).toSelf().inSingletonScope();
    container.bind(EndpointsHelper).toSelf().inSingletonScope();
    cheEditorsMetaYamlGenerator = container.get(CheEditorsMetaYamlGenerator);
  });
  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  test('basics', async () => {
    const cheEditorMetaInfo = await generateEditorMetaInfo('my/firstplugin/1.0.0');
    const cheEditorMetaInfos: CheEditorMetaInfo[] = [cheEditorMetaInfo];
    const result = await cheEditorsMetaYamlGenerator.compute(cheEditorMetaInfos);
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    const metaYamlInfo = result[0];

    const metaYamlInfoSpec: any = metaYamlInfo.spec;
    expect(metaYamlInfoSpec).toBeDefined();
    const metaYamlInfoSpecContainers = metaYamlInfoSpec.containers;
    if (!metaYamlInfoSpecContainers) {
      throw new Error('No spec containers');
    }
    expect(metaYamlInfoSpecContainers).toBeDefined();
    expect(metaYamlInfoSpecContainers.length).toBe(2);
    expect(metaYamlInfoSpecContainers[0].image).toBe('quay.io/devfile/universal-developer-image:latest');

    expect(metaYamlInfoSpec.endpoints).toBeDefined();
    expect(metaYamlInfoSpec.endpoints.length).toBe(4);
  });

  test('empty', async () => {
    const cheEditorMetaInfo = await generateEditorMetaInfo('my/firstplugin/1.0.0');
    cheEditorMetaInfo.components?.forEach(c => delete c.container);
    const result = await cheEditorsMetaYamlGenerator.compute([cheEditorMetaInfo]);
    const metaYamlInfo = result[0];
    expect(metaYamlInfo.spec.containers?.length).toBe(0);
  });

  test('invalid id', async () => {
    const cheEditorMetaInfo = await generateEditorMetaInfo('my/incomplete');
    const cheEditorMetaInfos: CheEditorMetaInfo[] = [cheEditorMetaInfo];
    await expect(cheEditorsMetaYamlGenerator.compute(cheEditorMetaInfos)).rejects.toThrow(
      'is not composed of 3 parts separated by /',
    );
  });

  test('non-numeric version', async () => {
    const cheEditorMetaInfo = await generateEditorMetaInfo('my/firstplugin/next');

    // no endpoint, container and init Containers
    delete cheEditorMetaInfo.components;

    const cheEditorMetaInfos: CheEditorMetaInfo[] = [cheEditorMetaInfo];
    const result = await cheEditorsMetaYamlGenerator.compute(cheEditorMetaInfos);
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    const metaYamlInfo = result[0];

    const metaYamlInfoSpec = metaYamlInfo.spec;
    expect(metaYamlInfoSpec).toBeDefined();
    const metaYamlInfoSpecContainers = metaYamlInfoSpec.containers;
    expect(metaYamlInfoSpecContainers).toBeUndefined();
  });
});
