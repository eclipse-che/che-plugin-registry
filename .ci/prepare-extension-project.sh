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
    cat workspace_url.txt
    export WORKSPACE_URL=$(tail -n 1 workspace_url.txt)
    echo "$WORKSPACE_URL"

    echo "-------"
    pods=$(kubectl get pod -n admin-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    echo "$pods"
    while [ "$pods" == 'No resources found in admin-che namespace.'  ];
    do
        echo "Workspace is not ready"
        kubectl get pod -n admin-che -l che.workspace_id
        sleep 10
        pods=$(kubectl get pod -n admin-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    done

    kubectl get pods -n admin-che -l che.workspace_id 

    ### Find workspace name and theia-ide container
    WORKSPACE_NAME=$(kubectl get pod -n admin-che -l che.workspace_id -o json | jq '.items[0].metadata.name' | tr -d \")
    THEIA_IDE_CONTAINER_NAME=$(kubectl get pod -n admin-che -l che.workspace_id -o json | jq '.items[0].metadata.annotations[]' | grep -P "theia-ide" | tr -d \")

    echo "Workspace name is: "
    echo "$WORKSPACE_NAME"
    echo "Theia IDE Container Name is: "
    echo "$THEIA_IDE_CONTAINER_NAME" 

    # Start the python3 selenium script that will connect to the workspace to run tests
    python3 $GITHUB_WORKSPACE/.ci/language-tests-runner.py "${WORKSPACE_URL}"
    sleep 20

    ### Copy extension's sources into theia container
    kubectl cp /tmp/projects/$YAML_EXTENSION_PROJECT_NAME admin-che/"${WORKSPACE_NAME}":/pojects -c $THEIA_IDE_CONTAINER_NAME    
    ### Check if copy
    kubectl cp admin-che/"${WORKSPACE_NAME}":/pojects/vscode-yaml/package.json /tmp/package.json -c $THEIA_IDE_CONTAINER_NAME    
    echo "----- Check content of package.json --------"
    cat /tmp/package.json
}

findRepositoryDetails
cloneExtension
buildProject
createWorkspace
