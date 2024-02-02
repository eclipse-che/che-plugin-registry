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

import { Container } from 'inversify';
import { DigestImagesHelper } from '../../src/devfle-yaml/digest-images-helper';
import { RegistryHelper } from '../../src/registry/registry-helper';
import { V222Devfile, V222DevfileComponentsItemsContainer } from '@devfile/api';

describe('Test DigestImagesHelper', () => {
  let container: Container;

  let editors: V222Devfile[];
  let digestImagesHelper: DigestImagesHelper;

  const registryHelperGetImageDigestMock = jest.fn();
  const registryHelper: any = {
    getImageDigest: registryHelperGetImageDigestMock,
  };

  beforeEach(async () => {
    const container1: V222DevfileComponentsItemsContainer = {
      image: 'container-image1:foo',
    };
    const container2: V222DevfileComponentsItemsContainer = {
      image: 'container-image2:bar',
    };
    editors = [
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
        ],
      },
      // empty spec
      {
        schemaVersion: '2.2.2',
        components: [{ name: 'empty-component' }],
      },
    ];
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();

    container.bind(DigestImagesHelper).toSelf().inSingletonScope();
    container.bind(RegistryHelper).toConstantValue(registryHelper);
    digestImagesHelper = await container.getAsync(DigestImagesHelper);
  });

  test('basics', async () => {
    registryHelperGetImageDigestMock.mockResolvedValueOnce('image-digest-1');
    registryHelperGetImageDigestMock.mockResolvedValueOnce('image-digest-2');

    const updatedYamls = await digestImagesHelper.updateImages(editors);
    expect(registryHelperGetImageDigestMock).toHaveBeenCalledTimes(2);

    const firstYaml = updatedYamls[0];
    const components = firstYaml.components;
    if (!components) {
      throw new Error('components not found');
    }
    expect(components[0].container?.image).toBe('image-digest-1');
    expect(components[1].container?.image).toBe('image-digest-2');
  });
});
