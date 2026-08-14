[![codecov](https://img.shields.io/codecov/c/github/eclipse-che/che-plugin-registry)](https://codecov.io/gh/eclipse-che/che-plugin-registry)

# Eclipse Che Plugin Registry

> **Deprecation Notice:** The embedded plugin registry is deprecated. Setting up an internal, on-premises Open VSX registry provides full control over the extension lifecycle, enables offline use, and improves compliance. Refer to the [Running the Open VSX On-Premises](https://eclipse.dev/che/docs/stable/administration-guide/running-the-open-vsx-on-premises/) procedure for detailed setup instructions.

This repository holds ready-to-use plugins for different languages and technologies as part of the embedded instance of the [Open VSX](https://open-vsx.org/about) registry to support air-gapped, offline, and proxy-restricted environments. The embedded Open VSX registry contains only a subset of the extensions published on open-vsx.org that can be used with Microsoft Visual Studio Code editor.

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
