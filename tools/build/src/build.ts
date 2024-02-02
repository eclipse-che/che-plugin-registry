/**********************************************************************
 * Copyright (c) 2020-2024 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as moment from 'moment';
import * as path from 'path';

import { Spinner, createSpinner } from 'nanospinner';
import { inject, injectable, named } from 'inversify';

import { CheEditorsAnalyzer } from './editor/che-editors-analyzer';
import { DigestImagesHelper } from './devfle-yaml/digest-images-helper';
import { ExternalImagesWriter } from './devfle-yaml/external-images-writer';
import { IndexWriter } from './devfle-yaml/index-writer';
import { DevfileYamlWriter } from './devfle-yaml/devfile-yaml-writer';
import { V222Devfile } from '@devfile/api';

@injectable()
export class Build {
  @inject('string')
  @named('PLUGIN_REGISTRY_ROOT_DIRECTORY')
  private pluginRegistryRootDirectory: string;

  @inject('string')
  @named('OUTPUT_ROOT_DIRECTORY')
  private outputRootDirectory: string;

  @inject('boolean')
  @named('SKIP_DIGEST_GENERATION')
  private skipDigests: boolean;

  @inject(DevfileYamlWriter)
  private devfileYamlWriter: DevfileYamlWriter;

  @inject(ExternalImagesWriter)
  private externalImagesWriter: ExternalImagesWriter;

  @inject(IndexWriter)
  private indexWriter: IndexWriter;

  @inject(DigestImagesHelper)
  private digestImagesHelper: DigestImagesHelper;

  @inject(CheEditorsAnalyzer)
  private cheEditorsAnalyzer: CheEditorsAnalyzer;

  updateTask<T>(promise: Promise<T>, task: Spinner, success: { (): void }, failureMessage: string): void {
    promise.then(success, () => task.error({ text: failureMessage }));
  }

  /**
   * Analyze che-editors.yaml
   */
  protected async analyzeCheEditorsYaml(): Promise<V222Devfile[]> {
    const cheEditorsPath = path.resolve(this.pluginRegistryRootDirectory, 'che-editors.yaml');
    const cheEditorsYaml = await this.cheEditorsAnalyzer.analyze(cheEditorsPath);

    // First, parse che-editors yaml
    const cheEditors: V222Devfile[] = await Promise.all(
      cheEditorsYaml.editors.map(async (cheEditorYaml: V222Devfile) => {
        const cheEditorMetaInfo: V222Devfile = { ...cheEditorYaml };
        return cheEditorMetaInfo;
      }),
    );

    return cheEditors;
  }

  async wrapIntoTask<T>(title: string, promise: Promise<T>, customTask?: Spinner): Promise<T> {
    let task: Spinner;
    if (customTask) {
      task = customTask;
    } else {
      task = createSpinner(title).start();
    }
    if (promise) {
      promise.then(
        () => task.success(),
        () => task.error(),
      );
    }
    return promise;
  }

  public async build(): Promise<void> {
    const start = moment();

    const cheEditors = await this.wrapIntoTask('Analyze che-editors.yaml file', this.analyzeCheEditorsYaml());
    const computedYamls = [...cheEditors];

    let allDevfileYamls = computedYamls;
    if (!this.skipDigests) {
      // update all images to use digest instead of tags
      allDevfileYamls = await this.wrapIntoTask(
        'Update tags by digests for OCI images',
        this.digestImagesHelper.updateImages(computedYamls),
      );
    }

    // generate index.json
    await this.wrapIntoTask('Generate v3/plugins/index.json file', this.indexWriter.write(allDevfileYamls));

    // generate v3/external_images.txt
    await this.wrapIntoTask('Generate v3/external_images.txt', this.externalImagesWriter.write(allDevfileYamls));

    // generate v3/plugins folder
    await this.wrapIntoTask('Write devfile.yamls in v3/plugins folder', this.devfileYamlWriter.write(allDevfileYamls));

    const end = moment();
    const duration = moment.duration(start.diff(end)).humanize();
    console.log(`🎉 Successfully generated in ${this.outputRootDirectory}. Took ${duration}.`);
  }
}
