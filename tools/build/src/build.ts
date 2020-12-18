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

import { CheEditorMetaInfo } from './editor/che-editors-meta-info';
import { CheEditorYaml } from './editor/che-editors-yaml';
import { CheEditorsAnalyzer } from './editor/che-editors-analyzer';
import { CheEditorsMetaYamlGenerator } from './editor/che-editors-meta-yaml-generator';
import { ChePluginMetaInfo } from './che-plugin/che-plugins-meta-info';
import { ChePluginYaml } from './che-plugin/che-plugins-yaml';
import { ChePluginsAnalyzer } from './che-plugin/che-plugins-analyzer';
import { ChePluginsMetaYamlGenerator } from './che-plugin/che-plugins-meta-yaml-generator';
import { CheTheiaPluginAnalyzerMetaInfo } from './che-theia-plugin/che-theia-plugin-analyzer-meta-info';
import { CheTheiaPluginYaml } from './che-theia-plugin/che-theia-plugins-yaml';
import { CheTheiaPluginsAnalyzer } from './che-theia-plugin/che-theia-plugins-analyzer';
import { CheTheiaPluginsMetaYamlGenerator } from './che-theia-plugin/che-theia-plugins-meta-yaml-generator';
import { FeaturedAnalyzer } from './featured/featured-analyzer';
import { FeaturedWriter } from './featured/featured-writer';
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

  @inject(CheTheiaPluginsMetaYamlGenerator)
  private cheTheiaPluginsMetaYamlGenerator: CheTheiaPluginsMetaYamlGenerator;

  @inject(CheEditorsMetaYamlGenerator)
  private cheEditorsMetaYamlGenerator: CheEditorsMetaYamlGenerator;

  @inject(ChePluginsMetaYamlGenerator)
  private chePluginsMetaYamlGenerator: ChePluginsMetaYamlGenerator;

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

  @inject(CheEditorsAnalyzer)
  private cheEditorsAnalyzer: CheEditorsAnalyzer;

  @inject(ChePluginsAnalyzer)
  private chePluginsAnalyzer: ChePluginsAnalyzer;

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
  protected async analyzeCheTheiaPluginsYaml(): Promise<CheTheiaPluginMetaInfo[]> {
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

    return analyzingCheTheiaPluginsWithIds;
  }

  /**
   * Analyze che-editors.yaml
   */
  protected async analyzeCheEditorsYaml(): Promise<CheEditorMetaInfo[]> {
    const cheEditorsPath = path.resolve(this.pluginRegistryRootDirectory, 'che-editors.yaml');
    const cheEditorsYaml = await this.cheEditorsAnalyzer.analyze(cheEditorsPath);

    // First, parse che-editors yaml
    const cheEditors: CheEditorMetaInfo[] = await Promise.all(
      cheEditorsYaml.editors.map(async (cheEditorYaml: CheEditorYaml) => {
        const cheEditorMetaInfo: CheEditorMetaInfo = { ...cheEditorYaml };
        return cheEditorMetaInfo;
      })
    );

    return cheEditors;
  }

  /**
   * Analyze che-plugins.yaml
   */
  protected async analyzeChePluginsYaml(): Promise<ChePluginMetaInfo[]> {
    const chePluginsPath = path.resolve(this.pluginRegistryRootDirectory, 'che-plugins.yaml');
    const chePluginsYaml = await this.chePluginsAnalyzer.analyze(chePluginsPath);

    // First, parse che-plugins yaml
    const chePlugins: ChePluginMetaInfo[] = await Promise.all(
      chePluginsYaml.plugins.map(async (chePluginYaml: ChePluginYaml) => {
        const chePluginMetaInfo: ChePluginMetaInfo = { ...chePluginYaml };
        return chePluginMetaInfo;
      })
    );

    // update editors
    return chePlugins;
  }

  public async build(): Promise<void> {
    // analyze the che-theia-plugins.yaml yaml file
    const cheTheiaPlugins = await this.analyzeCheTheiaPluginsYaml();
    const cheTheiaPluginsMetaYaml = await this.cheTheiaPluginsMetaYamlGenerator.compute(cheTheiaPlugins);

    const cheEditors = await this.analyzeCheEditorsYaml();
    const cheEditorsMetaYaml = await this.cheEditorsMetaYamlGenerator.compute(cheEditors);

    const chePlugins = await this.analyzeChePluginsYaml();
    const chePluginsMetaYaml = await this.chePluginsMetaYamlGenerator.compute(chePlugins);

    const allMetaYamls = [...cheTheiaPluginsMetaYaml, ...cheEditorsMetaYaml, ...chePluginsMetaYaml];

    // generate v3/plugins folder
    await this.metaYamlWriter.write(allMetaYamls);

    // generate featured.json
    const jsonOutput = await this.featuredAnalyzer.generate(cheTheiaPlugins);
    await this.featuredWriter.writeReport(jsonOutput);

    // generate Recommendations
    const recommendations = await this.recommendationsAnalyzer.generate(cheTheiaPlugins);
    await this.recommendationsWriter.writeRecommendations(recommendations);
  }
}
