/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as path from 'path';

import { injectable, postConstruct } from 'inversify';
import simpleGit, { SimpleGit } from 'simple-git';

// Needs to provide the name of the sidecar image for a given directory (like 'java11' or 'go')
@injectable()
export class SidecarDockerImage {
  public static readonly PREFIX_IMAGE: string = 'quay.io/eclipse/che-plugin-sidecar';

  private git: SimpleGit;

  private gitRootDirectory: string;

  constructor() {
    this.git = simpleGit();
  }

  @postConstruct()
  async init(): Promise<void> {
    this.gitRootDirectory = await this.git.revparse(['--show-toplevel']);
  }

  async getDockerImageFor(sidecarShortDirectory: string): Promise<string> {
    // use of short hash (abbreviated)
    const format = {
      hash: '%h',
    };
    const fullPathSideCarDirectory = path.resolve(this.gitRootDirectory, 'sidecars', sidecarShortDirectory);

    const logOptions = {
      format,
      // provide the path to the sidecars
      file: fullPathSideCarDirectory,
      // keep only one result
      n: '1',
    };
    const result = await this.git.log(logOptions);
    const latest = result.latest;
    const hash = latest.hash;
    return `${SidecarDockerImage.PREFIX_IMAGE}:${sidecarShortDirectory}-${hash}`;
  }
}
