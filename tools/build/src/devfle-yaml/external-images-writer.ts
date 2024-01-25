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

/**
 * Write in a file named external_images.txt, all the images referenced by plug-ins.
 */
@injectable()
export class ExternalImagesWriter {
  @inject('string')
  @named('OUTPUT_ROOT_DIRECTORY')
  private outputRootDirectory: string;

  async write(editors: V222Devfile[]): Promise<void> {
    const v3Folder = path.resolve(this.outputRootDirectory, 'v3');
    await fs.ensureDir(v3Folder);
    const externalImagesFile = path.join(v3Folder, 'external_images.txt');

    const referencedImages = editors
      .map(editor => {
        const images: string[] = [];
        const components = editor.components;
        if (components) {
          components.forEach(component => {
            if (component.container?.image) {
              images.push(component.container.image);
            }
          });
        }
        return images;
      })
      // flatten array of array into a single array
      .reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);

    // now, write the file
    await fs.writeFile(externalImagesFile, referencedImages.join('\n'));
  }
}
