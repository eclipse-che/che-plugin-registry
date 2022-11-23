/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
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

  test('che-theia', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'che-theia-meta.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('che-theia-latest');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(6);
    const theiaIdeComponent = devfileYaml.components[0];
    expect(theiaIdeComponent.name).toBe('theia-ide');
    const theiaIdeComponentContainer = theiaIdeComponent.container;
    expect(theiaIdeComponentContainer.image).toBe('quay.io/eclipse/che-theia:latest');

    expect(theiaIdeComponentContainer.endpoints).toBeDefined();
    expect(theiaIdeComponentContainer.endpoints?.length).toBe(8);
    const theiaIdeFirstEndpoint = theiaIdeComponentContainer.endpoints[0];
    expect(theiaIdeFirstEndpoint.name).toBe('theia');
    expect(theiaIdeFirstEndpoint.exposure).toBe('public');
    const theiaIdeFirstEndpointAttributes = theiaIdeFirstEndpoint.attributes;
    expect(theiaIdeFirstEndpointAttributes.type).toBe('main');

    expect(theiaIdeComponentContainer.env).toBeDefined();
    expect(theiaIdeComponentContainer.env?.length).toBe(4);
    const theiaIdeFirstEnv = theiaIdeComponentContainer.env[0];
    expect(theiaIdeFirstEnv.name).toBe('THEIA_PLUGINS');
    expect(theiaIdeFirstEnv.value).toBe('local-dir:///plugins');

    const theiaHostEnv = theiaIdeComponentContainer.env.find((env: any) => env.name === 'THEIA_HOST');
    expect(theiaHostEnv.name).toBe('THEIA_HOST');
    expect(theiaHostEnv.value).toBe('127.0.0.1');

    expect(theiaIdeComponentContainer.volumeMounts).toBeDefined();
    expect(theiaIdeComponentContainer.volumeMounts?.length).toBe(2);
    const theiaIdeFirstVolumeMount = theiaIdeComponentContainer.volumeMounts[0];
    expect(theiaIdeFirstVolumeMount.name).toBe('plugins');
    expect(theiaIdeFirstVolumeMount.path).toBe('/plugins');

    const remoteRuntimeInjectorComponent = devfileYaml.components[4];
    expect(remoteRuntimeInjectorComponent.name).toBe('remote-runtime-injector');
    const remoteRuntimeInjectorComponentContainer = remoteRuntimeInjectorComponent.container;
    expect(remoteRuntimeInjectorComponentContainer.image).toBe(
      'quay.io/eclipse/che-theia-endpoint-runtime-binary:latest'
    );

    const pluginsVolumeComponent = devfileYaml.components[1];
    expect(pluginsVolumeComponent.name).toBe('plugins');
    expect(pluginsVolumeComponent.volume).toStrictEqual({});

    const theiaLocalVolumeComponent = devfileYaml.components[2];
    expect(theiaLocalVolumeComponent.name).toBe('theia-local');
    expect(theiaLocalVolumeComponent.volume).toStrictEqual({});

    const remoteEndpointVolumeComponent = devfileYaml.components[5];
    expect(remoteEndpointVolumeComponent.name).toBe('remote-endpoint');
    expect(remoteEndpointVolumeComponent.volume).toBeDefined();
    expect(remoteEndpointVolumeComponent.volume.ephemeral).toBeTruthy();

    expect(devfileYaml.commands).toBeDefined();
    expect(devfileYaml.commands?.length).toBe(1);
    const devfileFirstCommand = devfileYaml.commands[0];
    expect(devfileFirstCommand.id).toBe('init-container-command');
    expect(devfileFirstCommand.apply).toStrictEqual({ component: 'remote-runtime-injector' });

    expect(devfileYaml.events).toBeDefined();
    expect(devfileYaml.events.preStart).toBeDefined();
    expect(devfileYaml.events?.preStart?.length).toBe(1);
    const preStartFirstEvent = devfileYaml.events.preStart[0];
    expect(preStartFirstEvent).toBe('init-container-command');
  });

  test('che-theia with multiple volumes which have identical name', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'che-theia-meta-with-multiple-volumes.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.components?.length).toBe(6);
    expect(devfileYaml.components?.find((value: any) => value.name === 'theia-ide')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'plugins')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'theia-local')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'che-machine-exec')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'remote-runtime-injector')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'remote-endpoint')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'non-existent')).toBeUndefined();
  });

  test('no container', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'no-container.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('che-theia');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(1);
    const component = devfileYaml.components[0];
    expect(component.name).toBe('foo');
    const componentContainer = component.container;
    expect(componentContainer.image).toBe('quay.io/foobar:next');
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
