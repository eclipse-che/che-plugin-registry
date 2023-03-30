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

import { ContainerHelper, Containers } from '../../src/common/container-helper';

import { CheEditorMetaInfo } from '../../src/editor/che-editors-meta-info';
import { Container } from 'inversify';
import { VolumeMountHelper } from '../../src/common/volume-mount-helper';

describe('Test ContainerHelper', () => {
  let containerHelper: ContainerHelper;
  let container: Container;
  let cheEditor: CheEditorMetaInfo;

  beforeEach(() => {
    cheEditor = {
      schemaVersion: '2.1.0',
      metadata: {
        displayName: 'VS Code - Open Source',
        description: 'Microsoft Visual Studio Code - Open Source IDE for Eclipse Che',
        icon: 'https://raw.githubusercontent.com/che-incubator/che-code/main/code/resources/server/code-512.png?sanitize=true',
        name: 'che-editor',
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
                targetPort: 3100,
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
          attributes: {
            ports: [{ port: 3011 }],
            'controller.devfile.io/container-contribution': true,
          },
        },
        {
          name: 'remote-runtime-injector',
          container: {
            image: 'quay.io/che-incubator/che-code:latest',
            volumeMounts: [
              {
                name: 'checode',
                path: '/checode',
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

    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind('string').toConstantValue('/fake-output').whenTargetNamed('OUTPUT_ROOT_DIRECTORY');

    container.bind(ContainerHelper).toSelf().inSingletonScope();
    container.bind(VolumeMountHelper).toSelf().inSingletonScope();
    containerHelper = container.get(ContainerHelper);
  });

  test('basics', async () => {
    const containers: Containers = await containerHelper.resolve(cheEditor);
    expect(containers).toBeDefined();
    expect(containers.containers.length).toBe(1);
  });

  test('empty components', async () => {
    delete cheEditor.components;
    const containers: Containers = await containerHelper.resolve(cheEditor);
    expect(containers).toBeDefined();
    expect(containers.containers.length).toBe(0);
    expect(containers.initContainers.length).toBe(0);
  });

  test('empty events', async () => {
    delete cheEditor.events;
    const containers: Containers = await containerHelper.resolve(cheEditor);
    expect(containers).toBeDefined();
    expect(containers.containers.length).toBe(2);
    expect(containers.initContainers.length).toBe(0);
  });

  test('empty prestart events', async () => {
    delete cheEditor.events?.preStart;
    const containers: Containers = await containerHelper.resolve(cheEditor);
    expect(containers).toBeDefined();
    expect(containers.containers.length).toBe(2);
    expect(containers.initContainers.length).toBe(0);
  });

  test('empty commands', async () => {
    delete cheEditor.commands;
    const containers: Containers = await containerHelper.resolve(cheEditor);
    expect(containers).toBeDefined();
    expect(containers.containers.length).toBe(2);
    expect(containers.initContainers.length).toBe(0);
  });
});
