/********************************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as jsyaml from 'js-yaml';

import Axios from 'axios';

export interface Extension {
  name?: string;
  version?: string;
  icon?: string;
  vsix?: string[];
  error: boolean;
  errorMessage?: string;
}

const metaYamlFiles = glob.sync('./../../v3/plugins/**/*.yaml');

async function checkAllPlugins() {
  const extensions: Extension[] = await Promise.all(
    metaYamlFiles.map(
      async (metaYamlFile): Promise<Extension> => {
        let metaYaml = await fs.readFile(metaYamlFile, 'utf-8');
        let metaYamlString;
        let extension: Extension = {
          error: false,
        };
        try {
          metaYamlString = jsyaml.safeLoad(metaYaml, { schema: jsyaml.JSON_SCHEMA });
        } catch (yamlErr) {
          extension.error = true;
          extension.errorMessage = `Error parsing YAML for ${metaYamlFile}: ${yamlErr}`;
          return extension;
        }

        if (metaYamlString) {
          let metaYamlObject: { icon?: string; name: string; version: string; spec?: { extensions?: [string] } };
          metaYamlObject = JSON.parse(JSON.stringify(metaYamlString, null, 2));
          extension.name = metaYamlObject.name;
          extension.version = metaYamlObject.version;

          // Check the icon
          if (metaYamlObject.icon) {
            extension.icon = metaYamlObject.icon;
            await Axios.get(metaYamlObject.icon)
              .then((response) => {})
              .catch((err) => {
                extension.error = true;
                extension.errorMessage = `Failed to download ${metaYamlObject.name}'s icon at ${metaYamlObject.icon}`;
              });
          }

          // Check the vsix files, if there are any
          if (metaYamlObject.spec && metaYamlObject.spec.extensions) {
            extension.vsix = [];
            for (let vsix of metaYamlObject.spec.extensions) {
              extension.vsix.push(vsix);
              await Axios.get(vsix)
                .then((response) => {})
                .catch((err) => {
                  extension.error = true;
                  extension.errorMessage = `Failed to download ${metaYamlObject.name}'s vsix at ${vsix}`;
                });
            }
          }
        }
        return extension;
      }
    )
  );

  // Check for errors, print them, and exit with code 1 if there are any
  let errors = extensions.filter((extension) => {
    if (extension.error) {
      console.log(`${extension.errorMessage} (${extension.name} version ${extension.version})`);
    }
  });
  if (errors) {
    process.exit(1);
  }
}

(async (): Promise<void> => {
  await checkAllPlugins();
})();
