/********************************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
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

    // cleanup folders
    await fs.remove(EXTENSION_ROOT_DIR);

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
