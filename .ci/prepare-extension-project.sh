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
    export YAML_EXTENSION_REPO_REVISION=$(yq -r --arg YAML_EXTENSION_REPO "$YAML_EXTENSION_REPO" '.plugins[] | select(.repository.url == $YAML_EXTENSION_REPO) | .repository.revision' che-theia-plugins.yaml)
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

function createWorkspace() {
    chectl workspace:create --start --devfile=https://raw.githubusercontent.com/svor/che-vscode-extension-tests/main/devfile.yaml > workspace_url.txt
    WORKSPACE_URL=$(tail -n 1 workspace_url.txt)
    echo "$WORKSPACE_URL"
    kubectl get pod -n eclipse-che --field-selector=status.phase==Running
    echo "-------"
    kubectl get pod -n eclipse-che -l che.workspace_id --field-selector=status.phase==Running
    pods=$(kubectl get pod -n eclipse-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    echo "pods = $pods"
    while [ "$pods" == 'No resources found.'  ];
    do
        echo "No pod found with che.workspace_id"
        echo "Current available pods are"
        kubectl get pod -n eclipse-che
        kubectl get pod -n eclipse-che -l che.workspace_id
        sleep 10
        pods=$(kubectl get pod -n eclipse-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    done    
}

findRepositoryDetails
cloneExtension
buildProject
createWorkspace
