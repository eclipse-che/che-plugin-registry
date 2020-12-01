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

import { inject, injectable, named } from 'inversify';

import { CheTheiaPluginAnalyzerMetaInfo } from './plugin/che-theia-plugin-analyzer-meta-info';
import { CheTheiaPluginYaml } from './plugin/che-theia-plugins-yaml';
import { CheTheiaPluginsAnalyzer } from './plugin/che-theia-plugins-analyzer';
import { FeaturedAnalyzer } from './featured/featured-analyzer';
import { FeaturedWriter } from './featured/featured-writer';
import { MetaYamlGenerator } from './meta-yaml/meta-yaml-generator';
import { MetaYamlWriter } from './meta-yaml/meta-yaml-writer';
import { RecommendationsAnalyzer } from './recommendations/recommendations-analyzer';
import { RecommendationsWriter } from './recommendations/recommendations-writer';
import { VsixInfo } from './extensions/vsix-info';
import { VsixUrlAnalyzer } from './extensions/vsix-url-analyzer';

export interface MetaYamlSpec {
  extensions: string[];
}
export interface MetaYaml {
  name: string;
  version: string;
  publisher: string;
  spec: MetaYamlSpec;
}

export interface CheTheiaPluginMetaInfo extends CheTheiaPluginAnalyzerMetaInfo {
  id: string;
}

@injectable()
export class Build {
  @inject('string[]')
  @named('ARGUMENTS')
  private args: string[];

  @inject('string')
  @named('PLUGIN_REGISTRY_ROOT_DIRECTORY')
  private pluginRegistryRootDirectory: string;

  @inject(FeaturedAnalyzer)
  private featuredAnalyzer: FeaturedAnalyzer;

  @inject(MetaYamlGenerator)
  private metaYamlGenerator: MetaYamlGenerator;

  @inject(MetaYamlWriter)
  private metaYamlWriter: MetaYamlWriter;

  @inject(FeaturedWriter)
  private featuredWriter: FeaturedWriter;

  @inject(RecommendationsAnalyzer)
  private recommendationsAnalyzer: RecommendationsAnalyzer;

  @inject(RecommendationsWriter)
  private recommendationsWriter: RecommendationsWriter;

  @inject(VsixUrlAnalyzer)
  private vsixUrlAnalyzer: VsixUrlAnalyzer;

  @inject(CheTheiaPluginsAnalyzer)
  private cheTheiaPluginsAnalyzer: CheTheiaPluginsAnalyzer;

  private cheTheiaPlugins: CheTheiaPluginMetaInfo[];

  constructor() {
    this.cheTheiaPlugins = [];
  }

  public async analyzeCheTheiaPlugin(
    cheTheiaPlugin: CheTheiaPluginAnalyzerMetaInfo,
    vsixExtensionUri: string
  ): Promise<void> {
    const vsixInfo = {
      uri: vsixExtensionUri,
      cheTheiaPlugin,
    };
    cheTheiaPlugin.vsixInfos.set(vsixExtensionUri, vsixInfo);
    await this.vsixUrlAnalyzer.analyze(vsixInfo);
  }

  /**
   * Analyze che-theia-plugins.yaml and download all related vsix files
   */
  protected async analyzeCheTheiaPluginsYaml(): Promise<void> {
    const cheTheiaPluginsPath = path.resolve(this.pluginRegistryRootDirectory, 'che-theia-plugins.yaml');
    const cheTheiaPluginsYaml = await this.cheTheiaPluginsAnalyzer.analyze(cheTheiaPluginsPath);

    // First, parse che-theia-plugins yaml
    const analyzingCheTheiaPlugins: CheTheiaPluginAnalyzerMetaInfo[] = await Promise.all(
      cheTheiaPluginsYaml.plugins.map(async (cheTheiaPluginYaml: CheTheiaPluginYaml) => {
        const extensions = cheTheiaPluginYaml.extensions || [];
        const vsixInfos = new Map<string, VsixInfo>();
        const id = cheTheiaPluginYaml.id;
        const featured = cheTheiaPluginYaml.featured || false;
        const aliases = cheTheiaPluginYaml.aliases || [];
        const sidecar = cheTheiaPluginYaml.sidecar;
        const repository = cheTheiaPluginYaml.repository;
        return { id, sidecar, aliases, extensions, featured, vsixInfos, repository };
      })
    );

    // analyze vsix of each che-theia plug-in
    await Promise.all(
      analyzingCheTheiaPlugins.map(async cheTheiaPlugin => {
        await Promise.all(
          cheTheiaPlugin.extensions.map(async vsixExtension => {
            await this.analyzeCheTheiaPlugin(cheTheiaPlugin, vsixExtension);
          })
        );
      })
    );

    // now need to add ids (if not existing) in the analyzed plug-ins
    const analyzingCheTheiaPluginsWithIds: CheTheiaPluginMetaInfo[] = analyzingCheTheiaPlugins.map(plugin => {
      let id: string;
      if (plugin.id) {
        id = plugin.id;
      } else {
        // need to compute id
        const firstExtension = plugin.extensions[0];
        const vsixDetails = plugin.vsixInfos.get(firstExtension);
        const packageInfo = vsixDetails?.packageJson;
        if (!packageInfo) {
          throw new Error(`Unable to find a package.json file for extension ${firstExtension}`);
        }
        const publisher = packageInfo.publisher;
        if (!publisher) {
          throw new Error(`Unable to find a publisher field in package.json file for extension ${firstExtension}`);
        }
        const name = packageInfo.name;
        if (!name) {
          throw new Error(`Unable to find a name field in package.json file for extension ${firstExtension}`);
        }
        id = `${publisher}/${name}`.toLowerCase();
      }

      return { ...plugin, id };
    });

    // update plug-ins
    this.cheTheiaPlugins = analyzingCheTheiaPluginsWithIds;
  }

  public async build(): Promise<void> {
    // analyze the che-theia-plugins.yaml yaml file
    await this.analyzeCheTheiaPluginsYaml();

    // generate v3/plugins
    const cheMetaYamlPlugins = await this.metaYamlGenerator.compute(this.cheTheiaPlugins);
    await this.metaYamlWriter.write(cheMetaYamlPlugins);

    // generate featured.json
    const jsonOutput = await this.featuredAnalyzer.generate(this.cheTheiaPlugins);
    await this.featuredWriter.writeReport(jsonOutput);

    // generate Recommendations
    const recommendations = await this.recommendationsAnalyzer.generate(this.cheTheiaPlugins);
    await this.recommendationsWriter.writeRecommendations(recommendations);
  }
}
