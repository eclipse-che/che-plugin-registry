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
import * as path from 'path';

import simpleGit, { SimpleGit } from 'simple-git';

import axios from 'axios';

export class IconCheck {
  private git: SimpleGit;

  private gitRootDirectory: Promise<string>;

  constructor() {
    this.git = simpleGit();
  }

  async check(icon: string): Promise<void> {
    if (!this.gitRootDirectory) {
      this.gitRootDirectory = this.git.revparse(['--show-toplevel']);
    }
    const gitRootDir = await this.gitRootDirectory;

    // relative path
    if (icon.startsWith('/')) {
      // check the file exists
      const iconPath = path.join(gitRootDir, icon);
      const exist = await fs.pathExists(iconPath);
      if (!exist) {
        throw new Error(`The icon with relative path ${icon} does not exists at ${iconPath}`);
      }
    } else {
      await axios.head(icon);
    }
  }
}
