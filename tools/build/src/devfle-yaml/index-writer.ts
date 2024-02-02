/**********************************************************************
 * Copyright (c) 2024 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as fs from 'fs-extra';
import * as path from 'path';

import { inject, injectable, named } from 'inversify';

import { V222Devfile } from '@devfile/api';
import { DevfileYamlWriter } from './devfile-yaml-writer';

/**
 * Write in a file named index.json, all the plugins that can be found.
 */
@injectable()
export class IndexWriter {
  @inject('string')
  @named('OUTPUT_ROOT_DIRECTORY')
  private outputRootDirectory: string;

  @inject(DevfileYamlWriter)
  private devfileYamlWriter: DevfileYamlWriter;

  private CHE_EDITOR_TYPE = 'Che Editor';

  async write(editors: V222Devfile[]): Promise<void> {
    const v3PluginsFolder = path.resolve(this.outputRootDirectory, 'v3', 'plugins');
    await fs.ensureDir(v3PluginsFolder);
    const externalImagesFile = path.join(v3PluginsFolder, 'index.json');

    const indexValues = editors.map(editor => {
      let id = this.devfileYamlWriter.verifyEditorId(editor);
      const splitIds = id.split('/');
      const publisher = splitIds[0];
      const name = splitIds[1];
      let version = splitIds[2];

      if (Number.isInteger(parseInt(version[0]))) {
        version = 'latest';
      }
      id = publisher + '/' + name + '/' + version;

      return {
        id: id,
        description: editor.metadata?.description,
        displayName: editor.metadata?.displayName,
        links: {
          devfile: `/v3/plugins/${id}/devfile.yaml`,
        },
        name: name,
        publisher: publisher,
        type: this.CHE_EDITOR_TYPE,
        version: version,
      };
    });
    indexValues.sort((pluginA, pluginB) => pluginA.id.localeCompare(pluginB.id));
    await fs.writeFile(externalImagesFile, JSON.stringify(indexValues, undefined, 2));
  }
}
