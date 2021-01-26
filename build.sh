#!/bin/bash
#
# Copyright (c) 2018-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e

REGISTRY="quay.io"
ORGANIZATION="eclipse"
TAG="nightly"
DOCKERFILE="./build/dockerfiles/Dockerfile"
BUILD_FLAGS=""
SKIP_OCI_IMAGE="false"
NODE_BUILD_OPTIONS="${NODE_BUILD_OPTIONS:-}"

USAGE="
Usage: ./build.sh [OPTIONS]
Options:
    --help
        Print this message.
    --tag, -t [TAG]
        Docker image tag to be used for image; default: 'nightly'
    --registry, -r [REGISTRY]
        Docker registry to be used for image; default 'quay.io'
    --organization, -o [ORGANIZATION]
        Docker image organization to be used for image; default: 'eclipse'
    --offline
        Build offline version of registry, with all artifacts included
        cached in the registry; disabled by default.
    --rhel
        Build using the rhel.Dockerfile (UBI images) instead of default
    --skip-oci-image
        Build artifacts but do not create the image
"

function print_usage() {
    echo -e "$USAGE"
}

function parse_arguments() {
    while [[ $# -gt 0 ]]; do
        key="$1"
        case $key in
            -t|--tag)
            TAG="$2"
            shift; shift;
            ;;
            -r|--registry)
            REGISTRY="$2"
            shift; shift;
            ;;
            -o|--organization)
            ORGANIZATION="$2"
            shift; shift;
            ;;
            --offline)
            BUILD_FLAGS="--embed-vsix:true"
            shift;
            ;;
            --skip-oci-image)
            SKIP_OCI_IMAGE="true"
            shift;
            ;;
            --rhel)
            DOCKERFILE="./build/dockerfiles/rhel.Dockerfile"
            shift
            ;;
            *)
            print_usage
            exit 0
        esac
    done
}

parse_arguments "$@"

echo "Update yarn dependencies..."
yarn
echo "Build tooling..."
yarn --cwd "$(pwd)/tools/build" build
echo "Generate artifacts..."
eval node "${NODE_BUILD_OPTIONS}" tools/build/lib/entrypoint.js --output-folder:"$(pwd)/output" ${BUILD_FLAGS}

if [ "${SKIP_OCI_IMAGE}" != "true" ]; then
  IMAGE="${REGISTRY}/${ORGANIZATION}/che-plugin-registry:${TAG}"
  VERSION=$(head -n 1 VERSION)
  echo "Building che plugin registry ${VERSION}."
  docker build -t "${IMAGE}" -f "${DOCKERFILE}" .
fi
