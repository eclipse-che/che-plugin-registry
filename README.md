[![codecov](https://img.shields.io/codecov/c/github/eclipse-che/che-plugin-registry)](https://codecov.io/gh/eclipse-che/che-plugin-registry)


# Eclipse Che Plugin Registry

This repository holds editor definitions and ready-to-use plugins for different languages and technologies as part of the embedded instance of the [Open VSX](https://open-vsx.org/about) registry to support air-gapped, offline, and proxy-restricted environments. The embedded Open VSX registry contains only a subset of the extensions published on open-vsx.org that can be used with Microsoft Visual Studio Code editor.

Current build from the main branch is available at [https://eclipse-che.github.io/che-plugin-registry/main/](https://eclipse-che.github.io/che-plugin-registry/main/).

## Prerequisites
 - nodejs 14.x and yarn v3.x

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

### Offline and airgapped registry

How to manage offline and airgapped registry for VSCode is described in [Extensions for Microsoft Visual Studio Code - Open Source](https://www.eclipse.org/che/docs/stable/administration-guide/extensions-for-microsoft-visual-studio-code-open-source/).
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

## Get index list of all editors

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
    "id": "che-incubator/che-code/latest",
    "description": "Microsoft Visual Studio Code - Open Source IDE for Eclipse Che",
    "displayName": "VS Code - Open Source",
    "links": {
      "devfile": "/v3/plugins/che-incubator/che-code/latest/devfile.yaml"
    },
    "name": "che-code",
    "publisher": "che-incubator",
    "type": "Che Editor",
    "version": "latest"
  },
  {
    "id": "che-incubator/che-idea/latest",
    "description": "JetBrains IntelliJ IDEA Community IDE for Eclipse Che",
    "displayName": "IntelliJ IDEA Community",
    "links": {
      "devfile": "/v3/plugins/che-incubator/che-idea/latest/devfile.yaml"
    },
    "name": "che-idea",
    "publisher": "che-incubator",
    "type": "Che Editor",
    "version": "latest"
  }
]
```

## Get devfile.yaml of an editor

Example:

```bash
curl  "http://localhost:8080/v3/plugins/che-incubator/che-code/latest/devfile.yaml"
```

Response:

```yaml
schemaVersion: 2.1.0
metadata:
  name: che-code
commands:
  - id: init-container-command
    apply:
      component: che-code-injector
  - id: init-che-code-command
    exec:
      component: che-code-runtime-description
      commandLine: nohup /checode/entrypoint-volume.sh > /checode/entrypoint-logs.txt 2>&1 &
events:
  preStart:
    - init-container-command
  postStart:
    - init-che-code-command
components:
  - name: che-code-runtime-description
    container:
      image: quay.io/devfile/universal-developer-image@sha256:80fdd1ae37d3b9e0260d9c66b4ff12e35317c31243eabeea5212d98c537a3ba9
      volumeMounts:
        - name: checode
          path: /checode
      memoryLimit: 1024Mi
      memoryRequest: 256Mi
      cpuLimit: 500m
      cpuRequest: 30m
      endpoints:
        - name: che-code
          attributes:
            type: main
            cookiesAuthEnabled: true
            discoverable: false
            urlRewriteSupported: true
          targetPort: 3100
          exposure: public
          secure: false
          protocol: https
        - name: code-redirect-1
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13131
          exposure: public
          protocol: http
        - name: code-redirect-2
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13132
          exposure: public
          protocol: http
        - name: code-redirect-3
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13133
          exposure: public
          protocol: http
    attributes:
      app.kubernetes.io/component: che-code-runtime
      app.kubernetes.io/part-of: che-code.eclipse.org
      controller.devfile.io/container-contribution: true
  - name: checode
    volume: {}
  - name: che-code-injector
    container:
      image: quay.io/che-incubator/che-code@sha256:8fd9eca7c28c59ce93c0b24c7ff0f38080e9a2ac66668274aeabc6b8f3144012
      command:
        - /entrypoint-init-container.sh
      volumeMounts:
        - name: checode
          path: /checode
      memoryLimit: 256Mi
      memoryRequest: 32Mi
      cpuLimit: 500m
      cpuRequest: 30m
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
