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
import * as jsyaml from 'js-yaml';
import * as moment from 'moment';
import * as path from 'path';
import * as semver from 'semver';

import simpleGit, { SimpleGit } from 'simple-git';

const EXTENSION_ROOT_DIR = '/tmp/extension_repository';

// struct for the array of vscode-extensions.json file
export interface CheTheiaPlugin {
  id?: string;
  isClosedSource?: boolean;
  repository: {
    url: string;
    revision: string;
    directory?: string;
  };
}

export interface CheTheiaPluginsFile {
  version: string;
  plugins: Array<CheTheiaPlugin>;
}

// Entry generated when inspecting an extension
export interface Entry {
  repositoryName: string;
  clonePath: string;
  extensionName?: string;
  registryVersion?: string;
  upstreamVersion?: string;
  extensionNeedsUpdating?: boolean;
  errors: string[];
}

// Generate the report
export class Report {
  // log the error and cleanup clone folder
  async handleError(entry: Entry, error: string): Promise<Entry> {
    // remove any carriage return, etc from the error message
    const cleanupError = error.replace(/(\r\n|\n|\r)/gm, '');
    entry.errors.push(cleanupError);
    console.log(`❌ ${entry.repositoryName} error:`, entry.errors);

    // cleanup any clone folder
    await fs.remove(entry.clonePath);
    return entry;
  }

  async generate(): Promise<void> {
    const start = moment();
    const cheTheiaPluginsFile = await fs.readFile('./../../che-theia-plugins.yaml', 'utf-8');
    let plugins;
    try {
      const cheTheiaPlugins = <CheTheiaPluginsFile>jsyaml.safeLoad(cheTheiaPluginsFile);
      plugins = cheTheiaPlugins.plugins;
    } catch (e) {
      console.error(`Error reading che-theia-plugins YAML file: ${e}`);
      return;
    }

    // cleanup folders
    await fs.remove(EXTENSION_ROOT_DIR);

    // grab results in parallel
    const entries: Entry[] = await Promise.all(
      plugins.map(
        async (plugin: CheTheiaPlugin): Promise<Entry> => {
          // path where to clone extension (remove all invalid characters)
          const cloneName = plugin.repository.url.replace(/[^\w\s]/gi, '');
          const entry: Entry = {
            clonePath: path.resolve(EXTENSION_ROOT_DIR, cloneName),
            repositoryName: plugin.repository.url,
            errors: [],
          };
          if (plugin.id) {
            entry.clonePath += plugin.id;
            entry.repositoryName += ` (${plugin.id})`;
          }
          if (plugin.isClosedSource === true) {
            if (!plugin.id) {
              return this.handleError(entry, `Closed source plug-in without id`);
            }
            entry.extensionName = `${plugin.id.split('/')[1]}`;
            entry.upstreamVersion = `SKIP (closed source)`;
            entry.registryVersion = `SKIP (closed source)`;
            entry.extensionNeedsUpdating = false;
            return entry;
          }

          // Clone repo with default branch to check current version
          const git: SimpleGit = simpleGit();
          try {
            await git.clone(plugin.repository.url, entry.clonePath);
          } catch (err) {
            return this.handleError(entry, `Error cloning: ${err}`);
          }

          // Parse package.json file and extract current version information
          let packageJSONPath;
          if (plugin.repository.directory) {
            packageJSONPath = path.join(entry.clonePath, plugin.repository.directory, 'package.json');
          } else {
            packageJSONPath = path.join(entry.clonePath, 'package.json');
          }
          let packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf-8'));
          entry.upstreamVersion = packageJSON.version;
          entry.extensionName = packageJSON.name;

          // Checkout git repo @ 'revision' field specified, to get the version in the registry
          try {
            await simpleGit(entry.clonePath).checkout(plugin.repository.revision);
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

          console.log(`✅ ${entry.repositoryName}`);
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
    return;
  }
}

(async (): Promise<void> => {
  await new Report().generate().catch(error => {
    console.log('Error:', error);
  });
})();
