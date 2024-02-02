/**********************************************************************
 * Copyright (c) 2020-2024 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as fs from 'fs-extra';
import * as jsyaml from 'js-yaml';
import * as path from 'path';

import { inject, injectable, named } from 'inversify';

import { V222Devfile } from '@devfile/api';

@injectable()
export class DevfileYamlWriter {
  @inject('string')
  @named('OUTPUT_ROOT_DIRECTORY')
  private outputRootDirectory: string;

  public static readonly DEFAULT_ICON = '/images/default.png';

  verifyEditorId(editor: V222Devfile): string {
    const metadata = editor.metadata;
    if (!metadata) {
      throw new Error(`The metadata of ${editor} is not defined`);
    }
    const id = metadata.name;
    if (!id) {
      throw new Error(`The id of ${metadata} is not defined`);
    }
    const values = id.split('/');
    if (values.length !== 3) {
      throw new Error(`The id for ${id} is not composed of 3 parts separated by / like <1>/<2>/<3>`);
    }
    return id;
  }

  async write(editorInfos: V222Devfile[]): Promise<V222Devfile[]> {
    // now, write the files
    const pluginsFolder = path.resolve(this.outputRootDirectory, 'v3', 'plugins');
    await fs.ensureDir(pluginsFolder);
    const imagesFolder = path.resolve(this.outputRootDirectory, 'v3', 'images');
    await fs.ensureDir(imagesFolder);
    const resourcesFolder = path.resolve(this.outputRootDirectory, 'v3', 'resources');
    await fs.ensureDir(resourcesFolder);

    const resultedEditors: V222Devfile[] = [];

    editorInfos.map(async cheEditor => {
      const id = this.verifyEditorId(cheEditor);
      const splitIds = id.split('/');
      const publisher = splitIds[0];
      const name = splitIds[1];
      let version = splitIds[2];
      if (Number.isInteger(parseInt(version[0]))) {
        version = 'latest';
      }

      const computedId = `${publisher}/${name}`;
      const devfilePath = path.resolve(pluginsFolder, computedId, version, 'devfile.yaml');
      await fs.ensureDir(path.dirname(devfilePath));

      if (cheEditor.metadata) {
        cheEditor.metadata.name = name;
      }
      resultedEditors.push(cheEditor);
      const devfileYaml = JSON.parse(JSON.stringify(cheEditor));
      const devfileYamlString = jsyaml.dump(devfileYaml, { noRefs: true, lineWidth: -1 });
      await fs.writeFile(devfilePath, devfileYamlString);
    });
    return resultedEditors;
  }
}
