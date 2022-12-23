[![codecov](https://img.shields.io/codecov/c/github/eclipse-che/che-plugin-registry)](https://codecov.io/gh/eclipse-che/che-plugin-registry)

# Eclipse Che Plugin Registry

This repository holds ready-to-use plugins for different languages and technologies.

Current build from the main branch is available at [https://eclipse-che.github.io/che-plugin-registry/main/](https://eclipse-che.github.io/che-plugin-registry/main/).

## Building and publishing third party VSIX extensions for plugin registry
See: https://github.com/redhat-developer/codeready-workspaces/blob/master/devdoc/building/build-vsix-extension.adoc


## Prerequisites
 - nodejs 14.x and yarn v1

## Build registry container image

This repository contains a `build.sh` script at its root that can be used to build the registry:
```
Usage: ./build.sh [OPTIONS]
Options:
    --help
        Print this message.
    --tag, -t [TAG]
        Docker image tag to be used for image; default: 'next'
    --registry, -r [REGISTRY]
        Docker registry to be used for image; default 'quay.io'
    --organization, -o [ORGANIZATION]
        Docker image organization to be used for image; default: 'eclipse'
    --offline
        Build offline version of registry, with all artifacts included
        cached in the registry; disabled by default.
    --skip-oci-image
        Build artifacts but do not create the image        
```

This script listens to the `BUILDER` variable, and will use the tool specified there to build the image. For example:
```sh
BUILDER=buildah ./build.sh
```

will force the build to use `buildah`. If `BUILDER` is not specified, the script will try to use `podman` by default. If `podman` is not installed, then `buildah` will be chosen. If neither `podman` nor `buildah` are installed, the script will finally try to build with `docker`.

### Offline and airgapped registry images

Using the `--offline` option in `build.sh` will build the registry to contain all referenced extension artifacts (i.e. all `.theia` and `.vsix` archives). The offline version of the plugin registry is useful in network-limited scenarios, as it avoids the need to download plugin extensions from the outside internet.

## Deploy the registry to OpenShift

You can deploy the registry to Openshift as follows:

```bash
  oc new-app -f deploy/openshift/che-plugin-registry.yml \
             -p IMAGE="quay.io/eclipse/che-plugin-registry" \
             -p IMAGE_TAG="next" \
             -p PULL_POLICY="Always"
```

## Run Eclipse Che plugin registry on Kubernetes

You can deploy Che plugin registry on Kubernetes using [helm](https://docs.helm.sh/). For example if you want to deploy it in the namespace `eclipse-che` and you are using `minikube` you can use the following command.

```bash
NAMESPACE="eclipse-che"
DOMAIN="$(minikube ip).nip.io"
helm upgrade --install che-plugin-registry \
    --debug \
    --namespace ${NAMESPACE} \
    --set global.ingressDomain=${DOMAIN} \
    deploy/kubernetes/che-plugin-registry/
```

You can use the following command to uninstall it.

```bash
helm delete --purge che-plugin-registry
```

## Run the registry

```bash
docker run -it  --rm  -p 8080:8080 quay.io/eclipse/che-plugin-registry:next
```

## Plugin meta YAML structure

Here is an overview of all fields that can be present in plugin meta YAML files. This document represents the current `v3` version.

```yaml
apiVersion:            # plugin meta.yaml API version -- v2; v1 supported for backwards compatability
publisher:             # publisher name; must match [-a-z0-9]+
name:                  # plugin name; must match [-a-z0-9]+
version:               # plugin version; must match [-.a-z0-9]+
type:                  # plugin type; e.g. "Theia plugin", "Che Editor"
displayName:           # name shown in user dashboard
title:                 # plugin title
description:           # short description of plugin's purpose
icon:                  # link to SVG or PNG icon
repository:            # URL for plugin (e.g. Github repo)
category:              # see [1]
firstPublicationDate:  # optional; see [2]
latestUpdateDate:      # optional; see [3]
deprecate:             # optional; section for deprecating plugins in favor of others
  autoMigrate:         # boolean
  migrateTo:           # new org/plugin-id/version, e.g. redhat/vscode-apache-camel/latest
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
      memoryLimit:       # Kubernetes/OpenShift-spec memory limit string (e.g. "512Mi"). Refer to https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-memory for details.
      memoryRequest:     # Kubernetes/OpenShift-spec memory request string (e.g. "256Mi"). Refer to https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-memory for details.
      cpuLimit:          # Kubernetes/OpenShift-spec CPU limit string (e.g. "500m", 0.5"). Refer to https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-cpu for details.
      cpuRequest:        # Kubernetes/OpenShift-spec CPU request string (e.g. "125m", "0.125"). Refer to https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-cpu for details.
      env:               # list of env vars to set in sidecar
        - name:
          value:
      command:           # optional; definition of root process command inside container
        - /bin/sh
      args:              # optional; list arguments for root process command inside container
        - -c
        - ./entrypoint.sh
      volumes:           # volumes required by plugin
        - mountPath:
          name:
          ephemeral: # boolean; if true volume will be ephemeral, otherwise volume will be persisted
      ports:             # ports exposed by plugin (on the container)
        - exposedPort:
      commands:          # development commands available to plugin container
        - name:
          workingDir:
          command:       # list of commands + arguments, e.g.:
            - rm
            - -rf
            - /cache/.m2/repository
      mountSources:      # boolean
      lifecycle:         # container lifecycle hooks -- see https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/
        postStart:       # the postStart event immediately after a Container is started -- see https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/
          exec:          # Executes a specific command, resources consumed by the command are counted against the Container
            command: ["/bin/sh", "-c", "/bin/post-start.sh"]  # Command is the command line to execute inside the container, the working directory for the command is root ('/')
                                                              # in the container's filesystem. The command is simply exec'd, it is not run inside a shell, so traditional shell
                                                              # instructions ('|', etc) won't work. To use a shell, you need to explicitly call out to that shell. Exit status
                                                              # of 0 is treated as live/healthy and non-zero is unhealthy
                                                              # -- see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#execaction-v1-core
        preStop:         # the preStop event immediately before the Container is terminated -- see https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/
          exec:          # Executes a specific command, resources consumed by the command are counted against the Container
            command: ["/bin/sh","-c","/bin/pre-stop.sh"]      # Command is the command line to execute inside the container, the working directory for the command is root ('/')
                                                              # in the container's filesystem. The command is simply exec'd, it is not run inside a shell, so traditional shell
                                                              # instructions ('|', etc) won't work. To use a shell, you need to explicitly call out to that shell. Exit status
                                                              # of 0 is treated as live/healthy and non-zero is unhealthy
                                                              # -- see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#execaction-v1-core
  initContainers:      # optional; init containers for sidecar plugin
    - image:
      name:              # name used for sidecar container
      memorylimit:       # Kubernetes/OpenShift-spec memory limit string (e.g. "512Mi")
      env:               # list of env vars to set in sidecar
        - name:
          value:
      command:           # optional; definition of root process command inside container
        - /bin/sh
      args:              # optional; list arguments for root process command inside container
        - -c
        - ./entrypoint.sh
      volumes:           # volumes required by plugin
        - mountPath:
          name:
          ephemeral: # boolean; if true volume will be ephemeral, otherwise volume will be persisted
      ports:             # ports exposed by plugin (on the container)
        - exposedPort:
      commands:          # development commands available to plugin container
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
    - relative:extension/resources/java-0.46.0-1549.vsix # example; see [4]
```

1 - Category must be equal to one of the following: "Editor", "Debugger", "Formatter", "Language", "Linter", "Snippet", "Theme", "Other"

2 - firstPublicationDate is not required to be present in YAML, as if not present, it will be generated during Plugin Registry dockerimage build

3 - latestUpdateDate is not required to be present in YAML, as it will be generated during Plugin Registry dockerimage build

4 - extensions starting with `relative:extension` are resolved relative to the path of `index.json` -- e.g. `v3`. This is primarily to support an offline or airgapped instance of the plugin registry. See [Offline and airgapped registry images](#offline-and-airgapped-registry-images) for details.

Note that the `spec` section above comes from the older `che-plugin.yaml` spec. The `endpoints`, `containers`, and `workspaceEnv` are passed back to Che server and are used to define the sidecar that is added to the workspace.

At the moment, some of these fields (that are related to plugin viewer) are validated during the Plugin Registry dockerimage build.

## Get index list of all plugins

Example:

```bash
curl  "http://localhost:8080/v3/plugins/index.json"
```

or

```bash
curl  "http://localhost:8080/v3/plugins/"
```

Response:

```json
[
  {
    "id": "eclipse/che-theia/latest",
    "displayName": "theia-ide",
    "version": "latest",
    "type": "Che Editor",
    "name": "che-theia",
    "description": "Eclipse Theia",
    "publisher": "eclipse",
    "links": {
      "self": "/v3/plugins/eclipse/che-theia/latest"
    }
  },
  {
    "id": "eclipse/x-lang-ls/2019.08.20",
    "displayName": "x lang support",
    "version": "2019.08.20",
    "type": "VS Code extension",
    "name": "x-lang-ls",
    "description": "Provides support for language x",
    "publisher": "eclipse",
    "deprecate": {
      "automigrate": true,
      "migrateTo": "eclipse/x-lang-ls/2019.11.05"
    },
     "links": {
      "self": "/v3/plugins/eclipse/x-lang-ls/2019.08.20"
    }
  },
  {
    "id": "eclipse/x-lang-ls/2019.11.05",
    "displayName": "x lang support",
    "version": "2019.11.05",
    "type": "VS Code extension",
    "name": "x-lang-ls",
    "description": "Provides support for language x",
    "publisher": "eclipse",
    "links": {
      "self": "/v3/plugins/eclipse/x-lang-ls/2019.11.05"
    }
  }
]
```

## Get meta.yaml of a plugin

Example:

```bash
curl  "http://localhost:8080/v3/plugins/eclipse/che-theia/latest/meta.yaml"
```

Response:

```yaml
apiVersion: v2
publisher: eclipse
name: che-theia
version: latest
type: Che Editor
displayName: Eclipse Theia
title: Eclipse Theia for Eclipse Che
description: Eclipse Theia for Eclipse Che
icon: /images/default.png
category: Editor
repository: https://github.com/eclipse-che/che-theia
firstPublicationDate: '2019-03-07'
latestUpdateDate: '2022-11-15'
spec:
  endpoints:
    - name: theia
      targetPort: 3100
      attributes:
        type: ide
        cookiesAuthEnabled: true
        discoverable: false
        urlRewriteSupported: true
        protocol: http
        secure: true
      public: true
    - name: webviews
      targetPort: 3100
      attributes:
        type: webview
        cookiesAuthEnabled: true
        discoverable: false
        unique: true
        urlRewriteSupported: true
        protocol: http
        secure: true
      public: true
    - name: mini-browser
      targetPort: 3100
      attributes:
        type: mini-browser
        cookiesAuthEnabled: true
        discoverable: false
        unique: true
        urlRewriteSupported: true
        protocol: http
        secure: true
      public: true
    - name: theia-dev
      targetPort: 3130
      attributes:
        type: ide-dev
        discoverable: false
        urlRewriteSupported: true
        protocol: http
      public: true
    - name: theia-redirect-1
      targetPort: 13131
      attributes:
        discoverable: false
        urlRewriteSupported: true
        protocol: http
      public: true
    - name: theia-redirect-2
      targetPort: 13132
      attributes:
        discoverable: false
        urlRewriteSupported: true
        protocol: http
      public: true
    - name: theia-redirect-3
      targetPort: 13133
      attributes:
        discoverable: false
        urlRewriteSupported: true
        protocol: http
      public: true
    - name: terminal
      targetPort: 3333
      attributes:
        type: collocated-terminal
        discoverable: false
        cookiesAuthEnabled: true
        urlRewriteSupported: true
        protocol: ws
        secure: true
      public: true
  containers:
    - image: quay.io/eclipse/che-theia@sha256:0f0eb1abd028a65c4664d9d32ba9679278c77ae41e6b8b64d6f46143f5ddd2e1
      env:
        - name: THEIA_PLUGINS
          value: local-dir:///plugins
        - name: HOSTED_PLUGIN_HOSTNAME
          value: 0.0.0.0
        - name: HOSTED_PLUGIN_PORT
          value: '3130'
        - name: THEIA_HOST
          value: 127.0.0.1
      mountSources: true
      memoryLimit: 512M
      cpuLimit: 1500m
      cpuRequest: 100m
      volumes:
        - name: plugins
          mountPath: /plugins
        - name: theia-local
          mountPath: /home/theia/.theia
      name: theia-ide
      ports:
        - exposedPort: 3100
        - exposedPort: 3130
        - exposedPort: 13131
        - exposedPort: 13132
        - exposedPort: 13133
    - image: quay.io/eclipse/che-machine-exec@sha256:7b1ca4c11bc213a5c782f6870ed7314d7281b2ae38d460abfb10d72a4a10828f
      memoryLimit: 128Mi
      memoryRequest: 32Mi
      cpuLimit: 500m
      cpuRequest: 30m
      command:
        - /go/bin/che-machine-exec
        - '--url'
        - 127.0.0.1:3333
      name: che-machine-exec
      ports:
        - exposedPort: 3333
  initContainers:
    - image: quay.io/eclipse/che-theia-endpoint-runtime-binary@sha256:8c903f900640530980f34b24e5d39abea93a5dfb456273b4b0c48f72ee6280b9
      env:
        - name: PLUGIN_REMOTE_ENDPOINT_EXECUTABLE
          value: /remote-endpoint/plugin-remote-endpoint
        - name: REMOTE_ENDPOINT_VOLUME_NAME
          value: remote-endpoint
      volumes:
        - name: plugins
          mountPath: /plugins
        - name: remote-endpoint
          mountPath: /remote-endpoint
          ephemeral: true
      name: remote-runtime-injector
```

# Builds

This repo contains several [actions](https://github.com/eclipse-che/che-plugin-registry/actions), including:
* [![release latest stable](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/release.yml/badge.svg)](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/release.yml)
* [![next builds](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/next-build.yml/badge.svg)](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/next-build.yml)
* [![PR](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/pr-checks.yml)
* [![try in webIDE](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/try-in-web-ide.yaml/badge.svg)](https://github.com/eclipse-che/che-plugin-registry/actions/workflows/try-in-web-ide.yaml)

Downstream builds can be found at the link below, which is _internal to Red Hat_. Stable builds can be found by replacing the 3.x with a specific version like 3.2.  

* [pluginregistry_3.x](https://main-jenkins-csb-crwqe.apps.ocp-c1.prod.psi.redhat.com/job/DS_CI/job/pluginregistry_3.x/)

NOTE: The registry downstream is a fork of upstream, with different plugin content and support for restricted environments enabled by default.


# License

Che is open sourced under the Eclipse Public License 2.0.
