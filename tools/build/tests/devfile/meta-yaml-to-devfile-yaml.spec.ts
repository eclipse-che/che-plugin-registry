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

  test('che-code', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'che-code-meta.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('che-code');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(3);

    const codeIdeComponent = devfileYaml.components[0];
    expect(codeIdeComponent.name).toBe('che-code-runtime-description');
    const codeIdeComponentContainer = codeIdeComponent.container;
    expect(codeIdeComponentContainer.image).toBe('quay.io/devfile/universal-developer-image:latest');
    expect(codeIdeComponentContainer.endpoints).toBeDefined();
    expect(codeIdeComponentContainer.endpoints?.length).toBe(4);
    const codeIdeFirstEndpoint = codeIdeComponentContainer.endpoints[0];
    expect(codeIdeFirstEndpoint.name).toBe('che-code');
    expect(codeIdeFirstEndpoint.exposure).toBe('public');
    const codeIdeFirstEndpointAttributes = codeIdeFirstEndpoint.attributes;
    expect(codeIdeFirstEndpointAttributes.type).toBe('main');

    expect(codeIdeComponentContainer.volumeMounts).toBeDefined();
    expect(codeIdeComponentContainer.volumeMounts?.length).toBe(1);
    const codeIdeFirstVolumeMount = codeIdeComponentContainer.volumeMounts[0];
    expect(codeIdeFirstVolumeMount.name).toBe('checode');
    expect(codeIdeFirstVolumeMount.path).toBe('/checode');

    const remoteRuntimeInjectorComponent = devfileYaml.components[2];
    expect(remoteRuntimeInjectorComponent.name).toBe('che-code-injector');
    const remoteRuntimeInjectorComponentContainer = remoteRuntimeInjectorComponent.container;
    expect(remoteRuntimeInjectorComponentContainer.image).toBe('quay.io/che-incubator/che-code:insiders');

    expect(devfileYaml.commands).toBeDefined();
    expect(devfileYaml.commands?.length).toBe(2);

    const devfileFirstCommand = devfileYaml.commands[0];
    expect(devfileFirstCommand.id).toBe('init-container-command');
    expect(devfileFirstCommand.apply).toStrictEqual({ component: 'che-code-injector' });

    const devfileSecondCommand = devfileYaml.commands[1];
    expect(devfileSecondCommand.id).toBe('init-che-code-command');
    expect(devfileSecondCommand.exec).toStrictEqual({
      component: 'che-code-runtime-description',
      commandLine: 'nohup /checode/entrypoint-volume.sh > /checode/entrypoint-logs.txt 2>&1 &',
    });

    expect(devfileYaml.events).toBeDefined();
    expect(devfileYaml.events.preStart).toBeDefined();
    expect(devfileYaml.events?.preStart?.length).toBe(1);
    const preStartFirstEvent = devfileYaml.events.preStart[0];
    expect(preStartFirstEvent).toBe('init-container-command');

    const postStartEvent = devfileYaml.events.postStart;
    expect(postStartEvent).toBeDefined();
    expect(postStartEvent[0]).toBe('init-che-code-command');
  });

  test('che-code with multiple volumes which have identical name', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'che-code-meta-with-multiple-volumes.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.components?.length).toBe(4);
    expect(devfileYaml.components?.find((value: any) => value.name === 'che-code-runtime-description')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'checode')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'che-code-injector')).toBeDefined();
    // expect(devfileYaml.components?.find((value: any) => value.name === 'remote-endpoint')).toBeDefined();
    expect(devfileYaml.components?.find((value: any) => value.name === 'non-existent')).toBeUndefined();
  });

  test('no container', async () => {
    const metaYamlPath = path.resolve(__dirname, '..', '_data', 'meta', 'no-container.yaml');
    const metaYamlContent = await fs.readFile(metaYamlPath, 'utf-8');
    const metaYaml = jsYaml.load(metaYamlContent);
    const devfileYaml = metaYamlToDevfileYaml.convert(metaYaml);
    expect(devfileYaml.schemaVersion).toBe('2.1.0');
    expect(devfileYaml.metadata?.name).toBe('che-code');
    expect(devfileYaml.components).toBeDefined();
    expect(devfileYaml.components?.length).toBe(1);
    const component = devfileYaml.components[0];
    expect(component.name).toBe('foo');
    const componentContainer = component.container;
    expect(componentContainer.image).toBe('quay.io/foobar:latest');
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
