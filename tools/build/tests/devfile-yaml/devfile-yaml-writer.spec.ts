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

import { Container } from 'inversify';
import { DevfileYamlWriter } from '../../src/devfle-yaml/devfile-yaml-writer';
import { V222Devfile } from '@devfile/api';

describe('Test MetaYamlWriter', () => {
  let container: Container;

  let editorDevfile: V222Devfile;
  let devfileYamlWriter: DevfileYamlWriter;

  function initContainer() {
    container = new Container();
    container.bind('string').toConstantValue('/fake-output').whenTargetNamed('OUTPUT_ROOT_DIRECTORY');

    container.bind(DevfileYamlWriter).toSelf().inSingletonScope();
  }

  beforeEach(() => {
    editorDevfile = {
      schemaVersion: '2.2.2',
      metadata: {
        name: 'custom-publisher/custom-name/custom-version',
        displayName: 'display-name',
        description: 'my-description',
        icon: '/fake-dir/icon.png',
        attributes: {
          publisher: 'my-publisher',
          version: 'my-version',
          title: 'my-title',
          repository: 'http://fake-repository',
          skipMetaYaml: true,
          firstPublicationDate: '2019-01-01',
        },
      },
      components: [
        {
          name: 'my-component',
          container: {
            image: 'quay.io/my-component',
          },
        },
      ],
    };
    jest.restoreAllMocks();
    jest.resetAllMocks();
    initContainer();
    devfileYamlWriter = container.get(DevfileYamlWriter);
  });

  test('basics', async () => {
    const fsCopyFileSpy = jest.spyOn(fs, 'copyFile');
    const fsEnsureDirSpy = jest.spyOn(fs, 'ensureDir');
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

    fsEnsureDirSpy.mockReturnValue();
    fsCopyFileSpy.mockReturnValue();
    fsWriteFileSpy.mockReturnValue();

    const editors: V222Devfile[] = [editorDevfile];
    const metaYalResults = await devfileYamlWriter.write(editors);
    expect(metaYalResults.length).toBe(1);
    expect(metaYalResults[0].metadata?.name).toBe('custom-name');

    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3/plugins');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(2, '/fake-output/v3/images');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(3, '/fake-output/v3/resources');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(
      4,
      '/fake-output/v3/plugins/custom-publisher/custom-name/custom-version',
    );
    const content = `schemaVersion: 2.2.2
metadata:
  name: custom-name
  displayName: display-name
  description: my-description
  icon: /fake-dir/icon.png
  attributes:
    publisher: my-publisher
    version: my-version
    title: my-title
    repository: http://fake-repository
    skipMetaYaml: true
    firstPublicationDate: '2019-01-01'
components:
  - name: my-component
    container:
      image: quay.io/my-component
`;
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(
      1,
      '/fake-output/v3/plugins/custom-publisher/custom-name/custom-version/devfile.yaml',
      content,
    );
  });

  test('editor with release version', async () => {
    const fsCopyFileSpy = jest.spyOn(fs, 'copyFile');
    const fsEnsureDirSpy = jest.spyOn(fs, 'ensureDir');
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

    fsEnsureDirSpy.mockReturnValue();
    fsCopyFileSpy.mockReturnValue();
    fsWriteFileSpy.mockReturnValue();

    if (editorDevfile.metadata) {
      editorDevfile.metadata.name = 'custom-publisher/custom-name/1.1.1';
    }
    const editors: V222Devfile[] = [editorDevfile];
    const metaYalResults = await devfileYamlWriter.write(editors);
    expect(metaYalResults.length).toBe(1);
    expect(metaYalResults[0].metadata?.name).toBe('custom-name');

    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(1, '/fake-output/v3/plugins');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(2, '/fake-output/v3/images');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(3, '/fake-output/v3/resources');
    expect(fsEnsureDirSpy).toHaveBeenNthCalledWith(4, '/fake-output/v3/plugins/custom-publisher/custom-name/latest');
    const content = `schemaVersion: 2.2.2
metadata:
  name: custom-name
  displayName: display-name
  description: my-description
  icon: /fake-dir/icon.png
  attributes:
    publisher: my-publisher
    version: my-version
    title: my-title
    repository: http://fake-repository
    skipMetaYaml: true
    firstPublicationDate: '2019-01-01'
components:
  - name: my-component
    container:
      image: quay.io/my-component
`;
    expect(fsWriteFileSpy).toHaveBeenNthCalledWith(
      1,
      '/fake-output/v3/plugins/custom-publisher/custom-name/latest/devfile.yaml',
      content,
    );
  });

  describe('getEditorId', () => {
    it('should return the editor id', () => {
      const editor: V222Devfile = {
        schemaVersion: '2.2.2',
        metadata: {
          name: 'publisher/name/version',
        },
      };

      const result = devfileYamlWriter.verifyEditorId(editor);

      expect(result).toEqual('publisher/name/version');
    });

    it('should throw an error if metadata is not defined', () => {
      const editor: V222Devfile = { schemaVersion: '2.2.2' };

      expect(() => {
        devfileYamlWriter.verifyEditorId(editor);
      }).toThrow('The metadata of [object Object] is not defined');
    });

    it('should throw an error if id is not defined', () => {
      const editor: V222Devfile = {
        schemaVersion: '2.2.2',
        metadata: {},
      };

      expect(() => {
        devfileYamlWriter.verifyEditorId(editor);
      }).toThrow('The id of [object Object] is not defined');
    });

    it('should throw an error if id is not composed of 3 parts separated by /', () => {
      const editor: V222Devfile = {
        schemaVersion: '2.2.2',
        metadata: {
          name: 'invalidId',
        },
      };

      expect(() => {
        devfileYamlWriter.verifyEditorId(editor);
      }).toThrow('The id for invalidId is not composed of 3 parts separated by / like <1>/<2>/<3>');
    });
  });
});
