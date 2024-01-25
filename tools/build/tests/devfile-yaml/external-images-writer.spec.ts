/**********************************************************************
 * Copyright (c) 2024 Red Hat, Inc.
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
import { ExternalImagesWriter } from '../../src/devfle-yaml/external-images-writer';
import { V222Devfile, V222DevfileComponentsItemsContainer } from '@devfile/api';

describe('Test ExternalImagesWriter', () => {
  let container: Container;

  let editors: V222Devfile[];
  let externalImagesWriter: ExternalImagesWriter;

  beforeEach(() => {
    const container1: V222DevfileComponentsItemsContainer = {
      image: 'container-image1:foo',
    };
    const container2: V222DevfileComponentsItemsContainer = {
      image: 'container-image2:bar',
    };
    editors = [
      // first plug-in has both containers and init containers
      {
        schemaVersion: '2.2.2',
        components: [
          {
            container: container1,
            name: 'first-component',
          },
          {
            name: 'second-component',
            container: container2,
          },
          {
            name: 'no-container-component',
          },
        ],
      },
      {
        schemaVersion: '2.2.2',
        components: [
          {
            name: 'c1',
            container: {
              image: 'image:1',
            },
          },
          {
            name: 'c2',
            container: {
              image: 'image:2',
            },
          },
        ],
      },
    ];
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind('string').toConstantValue('/fake-output').whenTargetNamed('OUTPUT_ROOT_DIRECTORY');

    container.bind(ExternalImagesWriter).toSelf().inSingletonScope();
    externalImagesWriter = container.get(ExternalImagesWriter);
  });

  test('basics', async () => {
    const fsEnsureDirSpy = jest.spyOn(fs, 'ensureDir');
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

    fsEnsureDirSpy.mockReturnValue();
    fsWriteFileSpy.mockReturnValue();

    await externalImagesWriter.write(editors);

    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3');

    const content = `container-image1:foo
container-image2:bar
image:1
image:2`;
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3/external_images.txt', content);
  });
});
