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

const ROOT_DIR = '/tmp/repository';

// struct for the array of vscode-extensions.json file
export interface Extension {
  repository: string;
  revision: string;
  directory?: string;
}

// Entry generated when inspecting an extension
export interface Entry {
  repositoryName: string;
  clonePath: string;
  extensionName?: string;
  registryVersion?: string;
  upstreamVersion?: string;
  needsUpdating?: boolean;
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

    // cleanup folder
    await fs.remove(ROOT_DIR);

    // grab result in parallel
    const entries: Entry[] = await Promise.all(
      extensions.map(
        async (extension: Extension): Promise<Entry> => {
          // path where to clone extension (remove all invalid characters)
          const cloneName = extension.repository.replace(/[^\w\s]/gi, '');
          const entry: Entry = {
            clonePath: path.resolve(ROOT_DIR, cloneName),
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
            entry.needsUpdating = false;
            return this.handleError(entry, `Failure: there is no upstream version`);
          } else if (!entry.registryVersion) {
            entry.needsUpdating = false;
            return this.handleError(entry, `Failure: there is no registry version`);
          } else {
            entry.needsUpdating = semver.gt(entry.upstreamVersion, entry.registryVersion);
          }

          // cleanup cloned directory for this extension
          await fs.remove(entry.clonePath);

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

    // cleanup root cloned path
    await fs.remove(ROOT_DIR);

    return;
  }
}

(async (): Promise<void> => {
  await new Report().generate().catch((error) => {
    console.log('Error:', error);
  });
})();
