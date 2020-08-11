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
import * as handlerbars from 'handlebars';
import * as moment from 'moment';
import * as path from 'path';
import * as semver from 'semver';

import simpleGit, { SimpleGit } from 'simple-git';

const EXTENSION_ROOT_DIR = '/tmp/extension_repository';
const SIDECAR_ROOT_DIR = '/tmp/sidecar_repository';

// struct for the array of vscode-extensions.json file
export interface Extension {
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

// Entry generated when inspecting an extension
export interface Entry {
  repositoryName: string;
  clonePath: string;
  sidecarClonePath?: string;
  extensionName?: string;
  registryVersion?: string;
  upstreamVersion?: string;
  extensionNeedsUpdating?: boolean;
  registrySidecarImage?: string;
  upstreamSidecarImage?: string;
  sidecarLocation?: string;
  sidecarNeedsUpdating?: boolean;
  errors: string[];
}

// Generate the report
export class Report {
  // log the error and cleanup clone folder
  async handleError(entry: Entry, error: string): Promise<Entry> {
    entry.errors.push(error);
    console.log(`❌ ${entry.repositoryName} error:`, entry.errors);

    // cleanup any clone folder
    await fs.remove(entry.clonePath);
    return entry;
  }

  async generate(): Promise<void> {
    const start = moment();
    const { extensions } = JSON.parse(await fs.readFile('./../../vscode-extensions.json', 'utf-8'));

    // cleanup folders
    await fs.remove(EXTENSION_ROOT_DIR);
    await fs.remove(SIDECAR_ROOT_DIR);

    // grab results in parallel
    const entries: Entry[] = await Promise.all(
      extensions.map(
        async (extension: Extension): Promise<Entry> => {
          // path where to clone extension (remove all invalid characters)
          const cloneName = extension.repository.replace(/[^\w\s]/gi, '');
          const entry: Entry = {
            clonePath: path.resolve(EXTENSION_ROOT_DIR, cloneName),
            repositoryName: extension.repository,
            errors: [],
          };

          // Clone repo with default branch to check current version
          const git: SimpleGit = simpleGit();
          try {
            await git.clone(extension.repository, entry.clonePath);
          } catch (err) {
            return this.handleError(entry, `Error cloning: ${err}`);
          }

          // Parse package.json file and extract current version information
          let packageJSONPath;
          if (extension.directory) {
            packageJSONPath = path.join(entry.clonePath, extension.directory, 'package.json');
          } else {
            packageJSONPath = path.join(entry.clonePath, 'package.json');
          }
          let packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf-8'));
          entry.upstreamVersion = packageJSON.version;
          entry.extensionName = packageJSON.name;

          // Checkout git repo @ 'revision' field specified, to get the version in the registry
          try {
            await simpleGit(entry.clonePath).checkout(extension.revision);
          } catch (err) {
            return this.handleError(entry, `Failure checking out extension.revision: ${err}`);
          }
          packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf-8'));
          entry.registryVersion = packageJSON.version;
          if (!entry.upstreamVersion) {
            entry.extensionNeedsUpdating = false;
            return this.handleError(entry, `Failure: there is no upstream version`);
          } else if (!entry.registryVersion) {
            entry.extensionNeedsUpdating = false;
            return this.handleError(entry, `Failure: there is no registry version`);
          } else {
            entry.extensionNeedsUpdating = semver.gt(entry.upstreamVersion, entry.registryVersion);
          }

          // cleanup cloned directory for this extension
          await fs.remove(entry.clonePath);

          // If the extension has a sidecar image, let's check it too
          if (extension.sidecar) {
            const sidecarCloneName = extension.sidecar.source.repository.replace(/[^\w\s]/gi, '');
            // Create unique clone path for the sidecar, otherwise there may be collisions
            entry.sidecarClonePath = path.resolve(SIDECAR_ROOT_DIR, sidecarCloneName, entry.clonePath);

            await fs.remove(entry.sidecarClonePath);
            // Clone sidecar repository
            try {
              await git.clone(extension.sidecar.source.repository, entry.sidecarClonePath);
            } catch (err) {
              return this.handleError(entry, `Error cloning sidecar repository: ${err}`);
            }

            const sidecarNameSplit = extension.sidecar.image.split(':');
            entry.sidecarLocation = `https://${sidecarNameSplit[0]}`;
            const registryImageVersion = sidecarNameSplit[1];
            // Filter out cases that do not adhere to the sidecar naming scheme
            if (
              registryImageVersion &&
              (!registryImageVersion.includes('latest') || !registryImageVersion.includes('next'))
            ) {
              let sidecarSHA1;
              entry.registrySidecarImage = registryImageVersion;
              // Run git rev-parse --short HEAD and get hash of the upstream image
              try {
                const gitRevision = extension.sidecar.source.revision
                  ? `origin/${extension.sidecar.source.revision}`
                  : 'HEAD';
                sidecarSHA1 = await simpleGit(entry.sidecarClonePath).revparse(['--short', `${gitRevision}`]);
              } catch (err) {
                return this.handleError(entry, `Error executing git rev-parse in sidecar repository: ${err}`);
              }
              // Compare versions
              let upstreamSidecarImageVersion;
              if (extension.sidecar.source.revision) {
                upstreamSidecarImageVersion = `${extension.sidecar.source.revision}-${sidecarSHA1}`;
                entry.sidecarNeedsUpdating = registryImageVersion !== upstreamSidecarImageVersion;
              } else {
                const sidecarRepoVersion = await fs.readFile(path.join(entry.sidecarClonePath, 'VERSION'), 'utf-8');
                const sidecarVersion = sidecarRepoVersion.replace(/\n/gi, '');
                upstreamSidecarImageVersion = `${sidecarVersion}-${sidecarSHA1}`;
              }
              entry.upstreamSidecarImage = upstreamSidecarImageVersion;
              entry.sidecarNeedsUpdating = registryImageVersion !== upstreamSidecarImageVersion;
            } else {
              return this.handleError(entry, `Error checking sidecar image versions: image name format not supported.`);
            }
            await fs.remove(entry.sidecarClonePath);
          }

          console.log(`✅ ${extension.repository}`);
          return entry;
        }
      )
    );

    // sort entries by VS Code extension name if present (and not by repository name)
    entries.sort((entry1, entry2) => {
      if (entry1.extensionName && entry2.extensionName) {
        return entry1.extensionName.localeCompare(entry2.extensionName);
      } else {
        return 0;
      }
    });

    // generate report
    const content = await fs.readFile(path.join(__dirname, '../src/check-plugin-update-template.md'), 'utf8');
    const template: HandlebarsTemplateDelegate = handlerbars.compile(content);
    const env = {
      entries: entries,
      reportTime: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      computeTime: moment.duration(moment().diff(start)).as('seconds'),
    };
    const generatedReport = template(env);
    try {
      await fs.writeFile('./report/index.md', generatedReport);
    } catch (err) {
      console.log(`Failed to write the report file (./report/index.md)`);
    }

    // cleanup root cloned paths
    await fs.remove(EXTENSION_ROOT_DIR);
    await fs.remove(SIDECAR_ROOT_DIR);

    return;
  }
}

(async (): Promise<void> => {
  await new Report().generate().catch((error) => {
    console.log('Error:', error);
  });
})();
