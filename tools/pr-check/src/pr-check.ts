/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as jsyaml from 'js-yaml';
import * as path from 'path';

import simpleGit, { SimpleGit } from 'simple-git';

import Axios from 'axios';
import { IconCheck } from './pr-icon-check';

const EXTENSION_ROOT_DIR = '/tmp/extension_repository';

// Object matching each entry in vscode-extensions.json
export interface VSCodeExtensionEntry {
  repository: string;
  revision: string;
  directory?: string;
  sidecar?: {
    image: string;
    source: {
      repository: string;
      revision?: string;
      directory?: string;
    };
  };
}

export interface VSCodeExtension {
  repository: string;
  revision: string;
  sidecar?: {
    image: string;
    source: {
      repository: string;
      revision?: string;
      directory?: string;
    };
  };
  error: boolean;
  errorMessages: string[];
}

export interface MetaYamlExtension {
  name?: string;
  version?: string;
  icon?: string;
  vsixList?: string[];
  error: boolean;
  errorMessage?: string;
}

const metaYamlFiles = glob.sync('./../../v3/plugins/**/*.yaml');
const prIconCheck = new IconCheck();
async function vscodeExtensionsFieldValidation() {
  const { extensions } = JSON.parse(await fs.readFile('./../../vscode-extensions.json', 'utf-8'));
  const vsCodeExtensions: VSCodeExtension[] = await Promise.all(
    extensions.map(
      async (extensionEntry: VSCodeExtensionEntry): Promise<VSCodeExtension> => {
        const vscodeExtension: VSCodeExtension = {
          repository: extensionEntry.repository,
          revision: extensionEntry.revision,
          error: false,
          errorMessages: [],
        };
        const git: SimpleGit = simpleGit();
        let extensionRepoValid = true;

        // Check repository validity before cloning and checking out revision
        try {
          await Axios.head(vscodeExtension.repository);
        } catch (err) {
          // Sometimes valid repos return 400, even though they are clone-able
          if (!err || !err.response) {
            extensionRepoValid = false;
            vscodeExtension.error = true;
            vscodeExtension.errorMessages.push(`Error cloning extension repository ${vscodeExtension.repository}`);
          }
          if (err.response && err.response.status) {
            if (err.response.status === 404) {
              extensionRepoValid = false;
              vscodeExtension.error = true;
              vscodeExtension.errorMessages.push(
                `Extension repository ${vscodeExtension.repository} is not valid (response: 404)`
              );
            }
            if (err.response.status === 429) {
              console.error(`Unable to check ${vscodeExtension.repository} due to rate limiting (response: 429)`);
            }
          }
        }
        // If the repository is valid, proceed with the clone and checkout the revision
        if (extensionRepoValid) {
          const cloneName = extensionEntry.repository.replace(/[^\w\s]/gi, '');
          const clonePath = path.resolve(EXTENSION_ROOT_DIR, cloneName);
          await git.clone(vscodeExtension.repository, clonePath);
          try {
            await simpleGit(clonePath).checkout(vscodeExtension.revision);
          } catch (err) {
            vscodeExtension.error = true;
            vscodeExtension.errorMessages.push(
              `Error checking out revision ${vscodeExtension.revision} for ${vscodeExtension.repository}`
            );
          }
          await fs.remove(clonePath);
        }

        if (extensionEntry.sidecar) {
          vscodeExtension.sidecar = extensionEntry.sidecar;
          try {
            await Axios.head(vscodeExtension.sidecar.source.repository);
          } catch (err) {
            if (err.response && err.response.status) {
              if (err.response.status === 404) {
                vscodeExtension.error = true;
                vscodeExtension.errorMessages.push(
                  `Sidecar repository ${vscodeExtension.sidecar.source.repository} is not valid (response: 404)`
                );
              }
              if (err.response.status === 429) {
                console.error(
                  `Unable to check ${vscodeExtension.sidecar.source.repository} due to rate limiting (response: 429)`
                );
              }
            } else {
              vscodeExtension.error = true;
              vscodeExtension.errorMessages.push(
                `Sidecar repository ${vscodeExtension.sidecar.source.repository} is not valid`
              );
            }
          }
        }
        return vscodeExtension;
      }
    )
  );
  // Clean up any cloned paths
  await fs.remove(EXTENSION_ROOT_DIR);

  // Check for errors, print them, and exit with code 1 if there are any
  const errors = vsCodeExtensions.filter(extension => {
    if (extension.error) {
      extension.errorMessages.forEach((error: string) => {
        console.error(error);
      });
      return true;
    }
    return false;
  });
  if (errors && errors.length > 0) {
    process.exit(1);
  }
}

async function iconsExtensions404Check() {
  const extensions: MetaYamlExtension[] = await Promise.all(
    metaYamlFiles.map(
      async (metaYamlFile: string): Promise<MetaYamlExtension> => {
        const metaYaml = await fs.readFile(metaYamlFile, 'utf-8');
        let metaYamlString;
        const extension: MetaYamlExtension = {
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
          const metaYamlObject: {
            icon?: string;
            name: string;
            version: string;
            spec?: { extensions?: [string] };
          } = JSON.parse(JSON.stringify(metaYamlString));
          extension.name = metaYamlObject.name;
          extension.version = metaYamlObject.version;

          // Check the icon
          if (metaYamlObject.icon) {
            extension.icon = metaYamlObject.icon;
            try {
              prIconCheck.check(metaYamlObject.icon);
            } catch (err) {
              extension.error = true;
              extension.errorMessage = `Failed to download ${metaYamlObject.name}'s icon at ${metaYamlObject.icon}`;
            }
          }

          // Check the vsix files, if there are any
          if (metaYamlObject.spec && metaYamlObject.spec.extensions) {
            extension.vsixList = [];
            for (const vsix of metaYamlObject.spec.extensions) {
              extension.vsixList.push(vsix);
              const hostedOnGitHub = vsix.includes('github.com');
              try {
                // GitHub release assets redirect to AWS, but AWS returns 403 for HEAD requests.
                // In this case, don't follow redirects and check for a 302 code instead.
                if (hostedOnGitHub) {
                  await Axios.head(vsix, { maxRedirects: 0 });
                } else {
                  await Axios.head(vsix);
                }
              } catch (err) {
                if (hostedOnGitHub && err.response.status === 302) {
                  break;
                }
                extension.error = true;
                extension.errorMessage = `Failed to download ${metaYamlObject.name}'s vsix at ${vsix} -- ${err}`;
              }
            }
          }
        }
        return extension;
      }
    )
  );

  // Check for errors, print them, and exit with code 1 if there are any
  const errors = extensions.filter(extension => {
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
  const myArgs = process.argv.slice(2);
  switch (myArgs[0]) {
    case 'icons-extensions-404':
      await iconsExtensions404Check();
      break;
    case 'validate-vscode-extensions.json-fields':
      await vscodeExtensionsFieldValidation();
      break;
    case 'all':
    default:
      await iconsExtensions404Check();
  }
})();
