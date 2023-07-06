/**********************************************************************
 * Copyright (c) 2020-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as fs from 'fs-extra';
import * as jsyaml from 'js-yaml';
import * as moment from 'moment';
import * as path from 'path';

import { inject, injectable, named } from 'inversify';

import { MetaYamlPluginInfo } from './meta-yaml-plugin-info';
import { MetaYamlToDevfileYaml } from '../devfile/meta-yaml-to-devfile-yaml';

@injectable()
export class MetaYamlWriter {
  @inject('string')
  @named('OUTPUT_ROOT_DIRECTORY')
  private outputRootDirectory: string;

  @inject(MetaYamlToDevfileYaml)
  private metaYamlToDevfileYaml: MetaYamlToDevfileYaml;

  // Path relative to plugin registry ROOT
  //    https://plugin-registry-eclipse-che.apps-crc.testing/v3
  //
  // It must work also for single root deployments
  //    https://che-eclipse-che.apps-crc.testing/plugin-registry/v3
  public static readonly DEFAULT_ICON = '/images/default.png';

  convertIdToPublisherAndName(id: string): [string, string] {
    const values = id.split('/');
    return [values[0], values[1]];
  }

  async write(metaYamlPluginInfos: MetaYamlPluginInfo[]): Promise<MetaYamlPluginInfo[]> {
    // now, write the files
    const pluginsFolder = path.resolve(this.outputRootDirectory, 'v3', 'plugins');
    await fs.ensureDir(pluginsFolder);
    const imagesFolder = path.resolve(this.outputRootDirectory, 'v3', 'images');
    await fs.ensureDir(imagesFolder);
    const resourcesFolder = path.resolve(this.outputRootDirectory, 'v3', 'resources');
    await fs.ensureDir(resourcesFolder);

    const apiVersion = 'v2';

    const metaYamlPluginGenerated: MetaYamlPluginInfo[] = [];
    await Promise.all(
      metaYamlPluginInfos.map(async plugin => {
        const id = plugin.id;
        let version = plugin.version;
        const name = plugin.name;
        const publisher = plugin.publisher;
        const type = plugin.type;

        // write icon if iconfFile is specified or use default icon
        let icon: string;
        const iconFile = plugin.iconFile;
        if (iconFile) {
          // write icon in v3/images folder
          const fileExtensionIcon = path.extname(path.basename(iconFile)).toLowerCase();
          const destIconFileName = `${publisher}-${name}-icon${fileExtensionIcon}`;
          await fs.copyFile(iconFile, path.resolve(imagesFolder, destIconFileName));
          icon = `/images/${destIconFileName}`;
        } else {
          icon = MetaYamlWriter.DEFAULT_ICON;
        }

        const displayName = plugin.displayName;
        const title = plugin.title;
        const description = plugin.description;
        const category = plugin.category;
        const repository = plugin.repository;
        const firstPublicationDate = plugin.firstPublicationDate;
        const latestUpdateDate = moment.utc().format('YYYY-MM-DD');
        const spec = plugin.spec;
        let aliases: string[];
        if (plugin.aliases) {
          aliases = plugin.aliases;
        } else {
          aliases = [];
        }

        // generate for the id and for all aliases
        const pluginsToGenerate = [
          this.convertIdToPublisherAndName(id),
          ...aliases.map(item => this.convertIdToPublisherAndName(item)),
        ];
        const promises: Promise<unknown>[] = [];
        await Promise.all(
          pluginsToGenerate.map(async pluginToWrite => {
            // replace the version number by latest
            if (!plugin.disableLatest) {
              version = 'latest';
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metaYaml: any = {
              apiVersion,
              publisher: pluginToWrite[0],
              name: pluginToWrite[1],
              version,
              type,
              displayName,
              title,
              description,
              icon,
              category,
              repository,
              firstPublicationDate,
              latestUpdateDate,
            };

            const computedId = `${metaYaml.publisher}/${metaYaml.name}`;

            // add deprecate/migrate info if it is an alias
            if (computedId !== id) {
              metaYaml.deprecate = {
                automigrate: true,
                migrateTo: `${id}/latest`,
              };
            }

            // add spec object
            metaYaml.spec = spec;
            const devfileYaml = this.metaYamlToDevfileYaml.convert(metaYaml);
            // cleanup attributes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metaYaml.spec?.containers?.forEach((container: any) => delete container.attributes);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metaYaml.spec?.initContainers?.forEach((initContainer: any) => delete initContainer.attributes);
            if (!metaYaml.spec) {
              delete metaYaml.spec;
            }
            const yamlString = jsyaml.dump(metaYaml, { noRefs: true, lineWidth: -1 });
            const generated = { ...metaYaml };
            generated.id = `${computedId}/${version}`;
            generated.skipIndex = plugin.skipIndex;
            generated.skipMetaYaml = plugin.skipMetaYaml;
            metaYamlPluginGenerated.push(generated);
            const pluginPath = path.resolve(pluginsFolder, computedId, version, 'meta.yaml');
            await fs.ensureDir(path.dirname(pluginPath));
            if (!plugin.skipMetaYaml) {
              promises.push(fs.writeFile(pluginPath, yamlString));
            }
            if (devfileYaml) {
              const devfilePath = path.resolve(pluginsFolder, computedId, version, 'devfile.yaml');
              const devfileYamlString = jsyaml.dump(devfileYaml, { noRefs: true, lineWidth: -1 });
              promises.push(fs.writeFile(devfilePath, devfileYamlString));
            }
          }),
        );
        return Promise.all(promises);
      }),
    );
    return metaYamlPluginGenerated;
  }
}
