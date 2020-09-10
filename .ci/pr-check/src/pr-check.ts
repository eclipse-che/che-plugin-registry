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
  vsixList?: string[];
  error: boolean;
  errorMessage?: string;
}

const metaYamlFiles = glob.sync('./../../v3/plugins/**/*.yaml');

async function iconsExtensions404Check() {
  const extensions: Extension[] = await Promise.all(
    metaYamlFiles.map(
      async (metaYamlFile: string): Promise<Extension> => {
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
          metaYamlObject = JSON.parse(JSON.stringify(metaYamlString));
          extension.name = metaYamlObject.name;
          extension.version = metaYamlObject.version;

          // Check the icon
          if (metaYamlObject.icon) {
            extension.icon = metaYamlObject.icon;
            try {
              await Axios.get(metaYamlObject.icon);
            } catch (err) {
              extension.error = true;
              extension.errorMessage = `Failed to download ${metaYamlObject.name}'s icon at ${metaYamlObject.icon}`;
            }
          }

          // Check the vsix files, if there are any
          if (metaYamlObject.spec && metaYamlObject.spec.extensions) {
            extension.vsixList = [];
            for (let vsix of metaYamlObject.spec.extensions) {
              extension.vsixList.push(vsix);
              try {
                await Axios.get(vsix);
              } catch (err) {
                extension.error = true;
                extension.errorMessage = `Failed to download ${metaYamlObject.name}'s vsix at ${vsix}`;
              }
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
      return true;
    }
    return false;
  });
  if (errors && errors.length > 0) {
    process.exit(1);
  }
}

(async (): Promise<void> => {
  let myArgs = process.argv.slice(2);
  switch (myArgs[0]) {
    case 'icons-extensions-404':
      await iconsExtensions404Check();
      break;
    case 'all':
    default:
      await iconsExtensions404Check();
  }
})();
