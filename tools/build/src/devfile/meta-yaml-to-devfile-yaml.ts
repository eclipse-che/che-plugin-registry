/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { injectable } from 'inversify';

/**
 * Convert meta.yaml into a devfile 2.0 syntax
 */
@injectable()
export class MetaYamlToDevfileYaml {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  componentsFromContainer(container: any): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component: any = {
      name: container.name,
      container: {
        image: container.image,
      },
    };
    if (container.command) {
      component.container.command = container.command;
    }
    if (container.args) {
      component.container.args = container.args;
    }
    if (container.env) {
      component.container.env = container.env;
    }
    if (container.attributes) {
      component.attributes = container.attributes;
    }

    if (container.volumes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component.container.volumeMounts = container.volumes.map((volume: any) => ({
        name: volume.name,
        path: volume.mountPath,
      }));

      // add volume components
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      container.volumes.map((volume: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const volumeComponent: any = {
          name: volume.name,
          volume: {},
        };
        if (volume.ephemeral === true) {
          volumeComponent.volume.ephemeral = true;
        }
        components.push(volumeComponent);
      });
    }
    if (container.mountSources) {
      component.container.mountSources = container.mountSources;
    }
    if (container.memoryLimit) {
      component.container.memoryLimit = container.memoryLimit;
    }
    if (container.memoryRequest) {
      component.container.memoryRequest = container.memoryRequest;
    }
    if (container.cpuLimit) {
      component.container.cpuLimit = container.cpuLimit;
    }
    if (container.cpuRequest) {
      component.container.cpuRequest = container.cpuRequest;
    }

    components.unshift(component);

    return components;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  convert(inputMetaYaml: any): any | undefined {
    // clone object to not modify the original source
    const metaYaml = JSON.parse(JSON.stringify(inputMetaYaml));

    let name = '';
    if (metaYaml.name) {
      name = metaYaml.name;
      name = name.replace(/\//gi, '-');
    } else {
      name = metaYaml.displayName;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devfileYaml: any = {
      schemaVersion: '2.1.0',
      metadata: {
        name: name,
      },
    };

    // for each container, add a component
    const metaYamlSpec = metaYaml.spec;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let components: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endpoints: any[] = [];
    // add all endpoints
    if (metaYamlSpec.endpoints && metaYamlSpec.endpoints.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metaYamlSpec.endpoints.forEach((endpoint: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const devfileEndpoint: any = {
          name: endpoint.name,
          attributes: endpoint.attributes,
        };
        devfileEndpoint.targetPort = endpoint.targetPort;
        if (endpoint.public === true) {
          devfileEndpoint.exposure = 'public';
        }

        if (endpoint.path) {
          devfileEndpoint.path = endpoint.path;
        }

        // ide type is moved to more generic main endpoint
        if (endpoint.attributes && endpoint.attributes['type'] === 'ide') {
          devfileEndpoint.attributes['type'] = 'main';
        }

        // if it's secured, remove secure option for now but add extra s on the protocol
        if (devfileEndpoint.attributes && devfileEndpoint.attributes.secure === true) {
          devfileEndpoint.secure = false;
          delete devfileEndpoint.attributes['secure'];
          // add extra s
          if (devfileEndpoint.attributes.protocol) {
            devfileEndpoint.attributes.protocol = `${devfileEndpoint.attributes.protocol}s`;
          }
        }

        // move protocol upper than inside attributes
        if (devfileEndpoint.attributes && devfileEndpoint.attributes.protocol) {
          devfileEndpoint.protocol = devfileEndpoint.attributes.protocol;
          delete devfileEndpoint.attributes['protocol'];
        }

        endpoints.push(devfileEndpoint);
      });
    }
    if (metaYamlSpec.containers) {
      // handle only one container from meta.yaml
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metaYamlSpec.containers.forEach((container: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const componentsFromContainer: any[] = this.componentsFromContainer(container);

        components = components.concat(componentsFromContainer);
      });
      // last component is the container component
      components[0].container.endpoints = endpoints;
    }

    const metaYamlCommands = metaYamlSpec.commands;
    if (metaYamlCommands && metaYamlCommands.length > 0) {
      devfileYaml.commands = metaYamlCommands;
    }

    const metaYamlEvents = metaYamlSpec.events;
    if (metaYamlEvents) {
      devfileYaml.events = metaYamlEvents;
    }

    if (metaYamlSpec.initContainers && metaYamlSpec.initContainers.length === 1) {
      // handle only one container from meta.yaml
      const initContainer = metaYamlSpec.initContainers[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const componentsFromContainer: any[] = this.componentsFromContainer(initContainer);

      // add a command
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const commands: any[] = devfileYaml.commands || [];
      if (commands.findIndex(command => command.id === 'init-container-command') < 0) {
        commands.push({
          id: 'init-container-command',
          apply: {
            component: componentsFromContainer[0].name,
          },
        });
        devfileYaml.commands = commands;
      }

      // add event
      const events = devfileYaml.events || {};
      const preStartEvents: string[] = events.preStart || [];
      if (preStartEvents.findIndex(event => event === 'init-container-command') < 0) {
        events.preStart = preStartEvents;
        preStartEvents.push('init-container-command');
        devfileYaml.events = events;
      }
      components = components.concat(componentsFromContainer);
    }

    // remove duplicated components, e.g. plugins
    // container and init container may provide two volumes with the same name
    // and it is enough to have in components list only one volume definition
    components = components.filter(function (item, pos, self) {
      return self.findIndex(value => value.name === item.name) === pos;
    });

    devfileYaml.components = components;
    return devfileYaml;
  }
}
