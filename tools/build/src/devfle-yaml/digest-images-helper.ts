/**********************************************************************
 * Copyright (c) 2024 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { inject, injectable } from 'inversify';

import { RegistryHelper } from '../registry/registry-helper';
import { V222Devfile } from '@devfile/api';

/**
 * Update all reference to images to use digest instead of tags.
 */
@injectable()
export class DigestImagesHelper {
  @inject(RegistryHelper)
  private registryHelper: RegistryHelper;

  async updateImages(editors: V222Devfile[]): Promise<V222Devfile[]> {
    return Promise.all(
      editors.map(async editor => {
        const components = editor.components;
        if (components) {
          await Promise.all(
            components.map(async component => {
              if (component.container) {
                component.container.image = await this.registryHelper.getImageDigest(component.container.image);
              }
            }),
          );
        }
        return editor;
      }),
    );
  }
}
