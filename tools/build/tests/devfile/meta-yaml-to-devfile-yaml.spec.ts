/**********************************************************************
 * Copyright (c) 2021-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import * as fs from 'fs-extra';
import * as jsYaml from 'js-yaml';
import * as path from 'path';

import { Container } from 'inversify';
import { MetaYamlToDevfileYaml } from '../../src/devfile/meta-yaml-to-devfile-yaml';

describe('Test MetaYamlToDevfileYaml', () => {
  let container: Container;

  let metaYamlToDevfileYaml: MetaYamlToDevfileYaml;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();

    container = new Container();
    container.bind(MetaYamlToDevfileYaml).toSelf().inSingletonScope();
    metaYamlToDevfileYaml = container.get(MetaYamlToDevfileYaml);
  });

  test('machine-exec', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'machine-exec-plugin-meta.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('che-machine-exec-plugin');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(1);
    const component = devfileYaml.components[0];
    expect(component.name).toBe('che-machine-exec');
    const componentContainer = component.container;
    expect(componentContainer.image).toBe('quay.io/eclipse/che-machine-exec:next');
    expect(componentContainer.command).toStrictEqual(['/go/bin/che-machine-exec', '--url', '127.0.0.1:4444']);

    expect(componentContainer.endpoints).toBeDefined();
    expect(componentContainer.endpoints?.length).toBe(2);
    const endpoint = componentContainer.endpoints[0];
    expect(endpoint.name).toBe('che-machine-exec');
    expect(endpoint.exposure).toBe('public');
    expect(endpoint.secure).toBe(false);
    expect(endpoint.protocol).toBe('wss');
    const endpointAttributes = endpoint.attributes;
    expect(endpointAttributes.type).toBe('terminal');
  });

  test('vscode extension', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'vscode-extension.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml).toBeUndefined();
  });

  test('container without endpoints', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'container-no-endpoints.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('no-endpoint');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(1);
    const component = devfileYaml.components[0];
    expect(component.name).toBe('no-endpoint');
    const componentContainer = component.container;
    expect(componentContainer.image).toBe('quay.io/no-endpoint');
  });

  test('container with minimal endpoint', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'container-minimal-endpoint.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('minimal-endpoint');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(1);
    const component = devfileYaml.components[0];
    expect(component.name).toBe('minimal-endpoint');
    const componentContainer = component.container;
    expect(componentContainer.image).toBe('quay.io/minimal-endpoint');
    expect(componentContainer.command).toStrictEqual(['foo']);
    expect(componentContainer.args).toStrictEqual(['bar']);

    expect(componentContainer.endpoints).toBeDefined();
    expect(componentContainer.endpoints?.length).toBe(1);
    const wwwEndpoint = componentContainer.endpoints[0];
    expect(wwwEndpoint.name).toBe('www');
    expect(wwwEndpoint.path).toBe('/hello');
    expect(wwwEndpoint.exposure).toBeUndefined();
    expect(wwwEndpoint.attributes).toBeUndefined();
  });
});
