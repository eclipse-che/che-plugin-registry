#!/bin/bash
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

set -e

function findRepositoryDetails() {
    export YAML_EXTENSION_REPO="https://github.com/redhat-developer/vscode-yaml"
    export YAML_EXTENSION_REPO_REVISION=$(yq -r --arg YAML_EXTENSION_REPOSITORY "$YAML_EXTENSION_REPOSITORY" '.plugins[] | select(.repository.url == $YAML_EXTENSION_REPOSITORY) | .repository.revision' che-theia-plugins.yaml)
    echo $YAML_EXTENSION_REPO
    echo $YAML_EXTENSION_REPO_REVISION
}

function cloneExtension() {
    export YAML_EXTENSION_PROJECT_NAME=$(basename "$YAML_EXTENSION_REPO")
    mkdir -p /tmp/projects/$YAML_EXTENSION_PROJECT_NAME
    git clone ${YAML_EXTENSION_REPO} /tmp/projects/$YAML_EXTENSION_PROJECT_NAME
    cd /tmp/projects/$YAML_EXTENSION_PROJECT_NAME
    git checkout tags/${YAML_EXTENSION_REPO_REVISION}
    git status
}

function buildProject() {
    yarn install
    yarn build
}

findRepositoryDetails
cloneExtension
buildProject
