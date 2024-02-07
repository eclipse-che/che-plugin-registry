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

import { V222Devfile, V222DevfileMetadata } from '@devfile/api';

/**
 * Write in a file named index.json, all the plugins that can be found.
 */
@injectable()
export class IndexWriter {
  @inject('string')
  @named('OUTPUT_ROOT_DIRECTORY')
  private outputRootDirectory: string;

  private CHE_EDITOR_TYPE = 'Che Editor';
  private DEFAULT_ICON = '/images/default.svg';

  async write(editors: V222Devfile[]): Promise<void> {
    const v3PluginsFolder = path.resolve(this.outputRootDirectory, 'v3', 'plugins');
    await fs.ensureDir(v3PluginsFolder);
    const externalImagesFile = path.join(v3PluginsFolder, 'index.json');

    const indexValues = editors.map(editor => {
      const metadata = this.getMetadata(editor);

      let id = this.getId(metadata);
      const splitIds = id.split('/');
      const publisher = splitIds[0];
      const name = splitIds[1];
      let version = splitIds[2];

      if (Number.isInteger(parseInt(version[0]))) {
        version = 'latest';
      }
      id = publisher + '/' + name + '/' + version;

      const icon = this.getIcon(metadata);
      const iconPathPrefix = '/v3';
      const iconPath = iconPathPrefix + icon;

      return {
        id: id,
        description: metadata.description,
        displayName: metadata.displayName,
        links: {
          devfile: `/v3/plugins/${id}/devfile.yaml`,
        },
        name: name,
        publisher: publisher,
        type: this.CHE_EDITOR_TYPE,
        version: version,
        icon: iconPath,
      };
    });
    indexValues.sort((pluginA, pluginB) => pluginA.id.localeCompare(pluginB.id));
    await fs.writeFile(externalImagesFile, JSON.stringify(indexValues, undefined, 2));
  }

  getMetadata(editor: V222Devfile): V222DevfileMetadata {
    const metadata = editor.metadata;
    if (!metadata) {
      throw new Error(`The metadata of ${JSON.stringify(editor)} is not defined`);
    }
    return metadata;
  }

  getIcon(metadata: V222DevfileMetadata): string {
    let icon = metadata.icon;
    if (!icon) {
      // If the icon is not defined, we use the default one
      icon = this.DEFAULT_ICON;
    }
    return icon;
  }

  getId(metadata: V222DevfileMetadata): string {
    const id = metadata.name;
    if (!id) {
      throw new Error(`The id of ${JSON.stringify(metadata)} is not defined`);
    }
    const values = id.split('/');
    if (values.length !== 3) {
      throw new Error(`The id for ${id} is not composed of 3 parts separated by / like <1>/<2>/<3>`);
    }
    return id;
  }
}
