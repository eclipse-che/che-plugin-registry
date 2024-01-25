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
import { IndexWriter } from '../../src/devfle-yaml/index-writer';
import { V222Devfile } from '@devfile/api';
import { DevfileYamlWriter } from '../../src/devfle-yaml/devfile-yaml-writer';

describe('Test IndexWriter', () => {
  let container: Container;
  const metaYamlWriterVerifyEditorIdMock = jest.fn();
  const metaYamlWriter: any = {
    verifyEditorId: metaYamlWriterVerifyEditorIdMock,
  };

  let editors: V222Devfile[];
  let indexWriter: IndexWriter;

  beforeEach(() => {
    editors = [
      {
        schemaVersion: '2.2.2',
        metadata: {
          name: 'my-publisher/my-name/latest',
          displayName: 'display-name',
          description: 'my-description',
          attributes: {
            tags: ['my-tag'],
            icon: 'my-icon',
            category: 'my-category',
            version: 'latest',
            publisher: 'my-publisher',
          },
        },
      },
      {
        schemaVersion: '2.2.2',
        metadata: {
          name: 'my-publisher/my-name/3.11',
          displayName: 'display-name',
          description: 'my-description',
          attributes: {
            version: '3.11',
            publisher: 'my-publisher',
          },
        },
      },
      {
        schemaVersion: '2.2.2',
        metadata: {
          name: 'my-publisher/my-che-editor-name/latest',
          displayName: 'display-name-che-editor',
          description: 'my-che-editor',
          attributes: {
            version: 'my-version',
            publisher: 'my-publisher',
          },
        },
      },
      {
        schemaVersion: '2.2.2',
      },
    ];
    jest.restoreAllMocks();
    jest.resetAllMocks();
    container = new Container();
    container.bind('string').toConstantValue('/fake-output').whenTargetNamed('OUTPUT_ROOT_DIRECTORY');
    container.bind(DevfileYamlWriter).toConstantValue(metaYamlWriter);

    container.bind(IndexWriter).toSelf().inSingletonScope();
    indexWriter = container.get(IndexWriter);
  });

  test('basics', async () => {
    metaYamlWriterVerifyEditorIdMock
      .mockReturnValueOnce('my-publisher/my-name/latest')
      .mockReturnValueOnce('my-publisher/my-name/3.11')
      .mockReturnValueOnce('my-publisher/my-che-editor-name/latest')
      .mockReturnValueOnce('my-publisher/no-metadatat/editor');
    const fsEnsureDirSpy = jest.spyOn(fs, 'ensureDir');
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

    fsEnsureDirSpy.mockReturnValue();
    fsWriteFileSpy.mockReturnValue();

    await indexWriter.write(editors);

    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3/plugins');

    expect(fsWriteFileSpy.mock.calls[0][0]).toBe('/fake-output/v3/plugins/index.json');
    const jsonOutput = JSON.parse(fsWriteFileSpy.mock.calls[0][1].toString());
    // result has been sorted
    expect(jsonOutput[0].id).toBe('my-publisher/my-che-editor-name/latest');
    expect(jsonOutput[0].description).toBe('my-che-editor');
    expect(jsonOutput[0].links.self).toBeUndefined();
    expect(jsonOutput[0].links.devfile).toBe('/v3/plugins/my-publisher/my-che-editor-name/latest/devfile.yaml');
    expect(jsonOutput[0].name).toBe('my-che-editor-name');
    expect(jsonOutput[0].publisher).toBe('my-publisher');
    expect(jsonOutput[0].type).toBe('Che Editor');
    expect(jsonOutput[0].version).toBe('latest');

    expect(jsonOutput[1].id).toBe('my-publisher/my-name/latest');
    expect(jsonOutput[1].description).toBe('my-description');
    expect(jsonOutput[1].links.devfile).toBe('/v3/plugins/my-publisher/my-name/latest/devfile.yaml');
    expect(jsonOutput[1].name).toBe('my-name');
    expect(jsonOutput[1].publisher).toBe('my-publisher');
    expect(jsonOutput[1].type).toBe('Che Editor');
    expect(jsonOutput[1].version).toBe('latest');

    expect(jsonOutput[2].id).toBe('my-publisher/my-name/latest');
    expect(jsonOutput[2].description).toBe('my-description');
    expect(jsonOutput[2].links.devfile).toBe('/v3/plugins/my-publisher/my-name/latest/devfile.yaml');
    expect(jsonOutput[2].name).toBe('my-name');
    expect(jsonOutput[2].publisher).toBe('my-publisher');
    expect(jsonOutput[2].type).toBe('Che Editor');
    expect(jsonOutput[2].version).toBe('latest');
  });
});
