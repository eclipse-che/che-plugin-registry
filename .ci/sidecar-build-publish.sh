#!/bin/bash
#
# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e

BUILD_PUBLISH="$1"
BUILD_ARGS="--push"
# shellcheck disable=SC2207
FILES_CHANGED=($(git diff --name-only --diff-filter=d -r "$2" "$3"))
SIDECARS_TO_TEST=()

for file in "${FILES_CHANGED[@]}"
do
    if [[ $file == sidecars/* ]]; then
        SIDECAR_NAME=$(echo "$file" | cut -d/ -f 2)
        # shellcheck disable=SC2199
        if ! [[ " ${SIDECARS_TO_TEST[@]} " =~ ${SIDECAR_NAME} ]]; then
            SIDECARS_TO_TEST+=("$SIDECAR_NAME")
            PLATFORMS=$(cat sidecars/"$SIDECAR_NAME"/PLATFORMS)
            SHORT_SHA1=$(git rev-parse --short HEAD)
            if [[ $BUILD_PUBLISH == 'build-publish' ]]; then
                IMAGE_NAME=quay.io/eclipse/che-plugin-sidecar:"$SIDECAR_NAME"-"$SHORT_SHA1"
                echo "Building $IMAGE_NAME"
                docker buildx build --platform "$PLATFORMS" -t "$IMAGE_NAME" \
                    "$BUILD_ARGS" sidecars/"$SIDECAR_NAME"/
            elif [[ $BUILD_PUBLISH == 'build' ]]; then
                echo "Checking $SIDECAR_NAME-$SHORT_SHA1"
                docker buildx build --platform "$PLATFORMS" sidecars/"$SIDECAR_NAME"/
            fi
        fi
    fi
done
