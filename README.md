[![CircleCI](https://circleci.com/gh/eclipse/che-plugin-registry.svg?style=svg)](https://circleci.com/gh/eclipse/che-plugin-registry)
[![Build Status](https://ci.centos.org/buildStatus/icon?job=devtools-che-plugin-registry-build-master/)](https://ci.centos.org/job/devtools-che-plugin-registry-build-master/)

# Eclipse Che plugin registry

## Build Eclipse Che plugin registry docker image

Execute
```shell
docker build --no-cache -t eclipse/che-plugin-registry .
```
Where `--no-cache` is needed to prevent usage of cached layers with plugin registry files.
Useful when you change plugin metadata files and rebuild the image.

## https://hub.docker.com/

Note that the Dockerfiles feature multi-stage build, so it requires Docker of version 17.05 and higher.
Though you may also just provide the image to the older versions of Docker (ex. on Minishift) by having it build on newer version, and pushing and pulling it from Docker Hub.

```eclipse/che-plugin-registry:latest``` image would be rebuilt after each commit in master

## OpenShift
You can deploy Che plugin registry on Openshift with command.
```
  oc new-app -f openshift/che-plugin-registry.yml \
             -p IMAGE="eclipse/che-plugin-registry" \
             -p IMAGE_TAG="latest" \
             -p PULL_POLICY="IfNotPresent"
```

## Kubernetes

You can deploy Che plugin registry on Kubernetes using [helm](https://docs.helm.sh/). For example if you want to deploy it in the namespace `kube-che` and you are using `minikube` you can use the following command.

```bash

NAMESPACE="kube-che"
DOMAIN="$(minikube ip).nip.io"
helm upgrade --install che-plugin-registry \
    --debug \
    --namespace ${NAMESPACE} \
    --set global.ingressDomain=${DOMAIN} \
    ./kubernetes/che-plugin-registry/

```

You can use the following command to uninstall it.

```bash

helm delete --purge che-plugin-registry

```

## Docker
```
docker run -it  --rm  -p 8080:8080 eclipse/che-plugin-registry
```
### Plugin meta YAML structure:
Here is an overview of all fields that can be present in plugin meta YAML files. This document represents the current `v3` version.

```yaml
apiVersion:            # v2; v1 supported for backwards compatability
publisher:             # publisher name; must match [-a-z0-9]+
name:                  # plugin name; must match [-a-z0-9]+
version:               # plugin version; must match [-.a-z0-9]+
type:                  # plugin type; e.g. "Theia plugin", "Che Editor"
displayName:           # name shown in user dashboard
title:                 # plugin title
description:           # short description of plugin's purpose
icon:                  # link to SVG icon
repository:            # URL for plugin (e.g. Github repo)
category:              # see [1]
firstPublicationDate:  # optional; see [2]
latestUpdateDate:      # optional; see [3]
deprecate:             # optional; section for deprecating plugins in favor of others
  autoMigrate:         # boolean
  migrateTo:           # new plugin id
spec:                  # spec (used to be che-plugin.yaml)
  endpoints:           # optional; plugin endpoints -- see https://www.eclipse.org/che/docs/che-6/servers.html for more details
    - name:
      public:            # if true, endpoint is exposed publicly
      targetPort:
      attributes:
        protocol:        # protocol used for communicating over endpoint, e.g. 'ws' or 'http'
        secure:          # use secure version of protocol above; convert 'ws' -> 'wss', 'http' -> 'https'
        discoverable:    # if false, no k8s service is created for this endpoint
        cookiesAuthEnabled: # if true, endpoint is exposed through JWTProxy
        type:
        path:
  containers:          # optional; sidecar containers for plugin
    - image:
      name:              # name used for sidecar container
      memorylimit:       # Kubernetes/OpenShift-spec memory limit string (e.g. "512Mi")
      env:               # list of env vars to set in sidecar
        - name:
          value:
      volumes:           # volumes required by plugin
        - mountPath:
          name:
      ports:             # ports exposed by plugin
        - exposedPort:
      commands:          # commands available to plugin container
        - name:
          workingDir:
          command:       # list of commands + arguments, e.g.:
            - rm
            - -rf
            - /cache/.m2/repository
      mountSources:      # boolean
  workspaceEnv:        # optional; env vars for the workspace
    - name:
      value:
  extensions:            # optional; required for VS Code/Theia plugins; list of urls to plugin artifacts (.vsix/.theia files) -- examples follow
    - https://github.com/Azure/vscode-kubernetes-tools/releases/download/0.1.17/vscode-kubernetes-tools-0.1.17.vsix # example
    - vscode:extension/redhat.vscode-xml # example
    - https://github.com/redhat-developer/omnisharp-theia-plugin/releases/download/v0.0.1/omnisharp_theia_plugin.theia # example
```

1 - Category must be equal to one of the following: "Editor", "Debugger", "Formatter", "Language", "Linter", "Snippet", "Theme", "Other"

2 - firstPublicationDate is not required to be present in YAML, as if not present, it will be generated during Plugin Registry dockerimage build

3 - latestUpdateDate is not required to be present in YAML, as it will be generated during Plugin Registry dockerimage build

Note that the `spec` section above comes from the older `che-plugin.yaml` spec. The `endpoints`, `containers`, and `workspaceEnv` are passed back to Che server and are used to define the sidecar that is added to the workspace.

At the moment, some of these fields (that are related to plugin viewer) are validated during the Plugin Registry dockerimage build.

## Get index list of all plugins
Example:
```
curl  "http://localhost:8080/v2/plugins/index.json"
```
or
```
curl  "http://localhost:8080/v2/plugins/"
```
Response:
```javascript
[
  {
    "publisher": "che-incubator",
    "name": "theia",
    "version": "1.0.0",
    "id": "che-incubator/theia/1.0.0",
    "type": "Che Editor",
    "displayName": "Eclipse Theia",
    "description": "Eclipse Theia",
    "links": {
      "self": "/plugins/che-incubator/theia/1.0.0"
    }
  },
  {
    "publisher": "che-incubator",
    "name": "theia",
    "version": "next",
    "id": "che-incubator/theia/next",
    "type": "Che Editor",
    "displayName": "Eclipse Theia",
    "description": "Eclipse Theia",
    "links": {
      "self": "/plugins/che-incubator/theia/next"
    }
  },
  {
    "publisher": "ws-skeleton",
    "name": "che-service-plugin",
    "version": "0.0.1",
    "id": "ws-skeleton/che-service-plugin/0.0.1",
    "type": "Che Plugin",
    "displayName": "Che Service",
    "description": "Che Plug-in with Theia plug-in and container definition providing a service",
    "links": {
      "self": "/plugins/ws-skeleton/che-service-plugin/0.0.1"
    }
  },
  {
    "publisher": "",
    "name": "che-dummy-plugin",
    "version": "0.0.1",
    "deprecate": {
      "migrateTo": "ws-skeleton/che-dummy-plugin/0.0.1",
      "autoMigrate": true
    },
    "id": "che-dummy-plugin/0.0.1",
    "type": "Che Plugin",
    "displayName": "Che dummy plugin",
    "description": "A hello world theia plug-in wrapped into a Che Plug-in",
    "links": {
      "self": "/plugins/che-dummy-plugin/0.0.1"
    }
  },
  {
    "publisher": "ws-skeleton",
    "name": "che-dummy-plugin",
    "version": "0.0.1",
    "id": "ws-skeleton/che-dummy-plugin/0.0.1",
    "type": "Che Plugin",
    "displayName": "Che dummy plugin",
    "description": "A hello world theia plug-in wrapped into a Che Plug-in",
    "links": {
      "self": "/plugins/ws-skeleton/che-dummy-plugin/0.0.1"
    }
  }
]
```
## Get meta.yaml of a plugin
Example:
```
curl  "http://localhost:8080/v2/plugins/che-incubator/theia/1.0.0"
```
or
```
curl  "http://localhost:8080/v2/plugins/che-incubator/theia/1.0.0/meta.yaml"
```
Response:
```yaml
publisher: che-incubator
name: theia
version: 1.0.0
id: che-incubator/theia/1.0.0
type: Che Editor
displayName: Eclipse Theia
title: Eclipse Theia for Eclipse Che
description: Eclipse Theia
icon: https://pbs.twimg.com/profile_images/929088242456190976/xjkS2L-0_400x400.jpg
url: https://github.com/ws-skeleton/che-editor-theia/releases/download/untagged-892e01b21d0145207b0f/che-editor-plugin.tar.gz
```

### License
Che is open sourced under the Eclipse Public License 2.0.
