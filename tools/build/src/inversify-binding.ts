/**********************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import 'reflect-metadata';
import 'reflect-metadata';

import * as fs from 'fs-extra';
import * as path from 'path';

import { Build } from './build';
import { Container } from 'inversify';
import { commonModule } from './common/common-module';
import { devfileModule } from './devfile/devfile-module';
import { editorModule } from './editor/editor-module';
import { metaYamlModule } from './meta-yaml/meta-yaml-module';
import { registryModule } from './registry/registry-module';

export class InversifyBinding {
  private container: Container;

  public async initBindings(): Promise<Container> {
    let outputDirectory = '/tmp/che-plugin-registry/output-folder';
    const downloadDirectory = '/tmp/che-plugin-registry/download-folder';
    const unpackedDirectory = '/tmp/che-plugin-registry/unpack-folder';

    let pluginRegistryRootDirectory = path.resolve(__dirname, '..', '..', '..');

    let embedVsix = false;
    let skipDigestGeneration = false;

    const args = process.argv.slice(2);
    args.forEach(arg => {
      if (arg.startsWith('--output-folder:')) {
        outputDirectory = arg.substring('--output-folder:'.length);
      }
      if (arg.startsWith('--root-folder:')) {
        pluginRegistryRootDirectory = arg.substring('--root-folder:'.length);
      }
      if (arg.startsWith('--embed-vsix:')) {
        embedVsix = 'true' === arg.substring('--embed-vsix:'.length);
      }
      if (arg.startsWith('--skip-digest-generation:')) {
        skipDigestGeneration = 'true' === arg.substring('--skip-digest-generation:'.length);
      }
    });
    this.container = new Container();
    this.container.load(commonModule);
    this.container.load(devfileModule);
    this.container.load(editorModule);
    this.container.load(metaYamlModule);
    this.container.load(registryModule);

    this.container.bind(Build).toSelf().inSingletonScope();

    this.container.bind('string[]').toConstantValue(args).whenTargetNamed('ARGUMENTS');

    this.container.bind('string').toConstantValue(unpackedDirectory).whenTargetNamed('UNPACKED_ROOT_DIRECTORY');
    this.container.bind('string').toConstantValue(downloadDirectory).whenTargetNamed('DOWNLOAD_ROOT_DIRECTORY');
    this.container
      .bind('string')
      .toConstantValue(pluginRegistryRootDirectory)
      .whenTargetNamed('PLUGIN_REGISTRY_ROOT_DIRECTORY');
    this.container.bind('string').toConstantValue(outputDirectory).whenTargetNamed('OUTPUT_ROOT_DIRECTORY');

    this.container.bind('boolean').toConstantValue(embedVsix).whenTargetNamed('EMBED_VSIX');

    this.container.bind('boolean').toConstantValue(skipDigestGeneration).whenTargetNamed('SKIP_DIGEST_GENERATION');

    await fs.mkdirs(unpackedDirectory);
    await fs.mkdirs(downloadDirectory);
    await fs.mkdirs(outputDirectory);

    return this.container;
  }
}
