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

import { Container } from 'inversify';
import { SidecarDockerImage } from '../../src/sidecar/sidecar-docker-image';

describe('Test Sidecar', () => {
  let container: Container;

  let sidecarDockerImage: SidecarDockerImage;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind(SidecarDockerImage).toSelf().inSingletonScope();
    sidecarDockerImage = container.get(SidecarDockerImage);
  });

  test('basics', async () => {
    await sidecarDockerImage.init();
    const result = await sidecarDockerImage.getDockerImageFor('go');
    expect(result).toContain('quay.io/eclipse/che-plugin-sidecar:go-');
  });
});
