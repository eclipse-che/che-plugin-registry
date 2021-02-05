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

    echo "-------"
    pods=$(kubectl get pod -n eclipse-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    echo "$pods"
    while [ "$pods" == 'No resources found in eclipse-che namespace.'  ];
    do
        echo "Workspace is not ready"
        kubectl get pod -n eclipse-che -l che.workspace_id
        sleep 10
        pods=$(kubectl get pod -n eclipse-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    done

    kubectl get pods -n eclipse-che -l che.workspace_id 

    ### Now we need to wait until we see some arguments in the output of the theia pod
    ### Once we see this correct output then we can proceed by running cat on the created file
    ### that lives in the workspace
    workspace_name=$(kubectl get pod -n eclipse-che -l che.workspace_id -o json | jq '.items[0].metadata.name' | tr -d \")
    theia_ide_container_name=$(kubectl get pod -n eclipse-che -l che.workspace_id -o json | jq '.items[0].metadata.annotations[]' | grep -P "theia-ide" | tr -d \")

    echo "Workspace name is: "
    echo "$workspace_name"
    echo "Theia IDE Container Name is: "
    echo "$theia_ide_container_name"   
}

findRepositoryDetails
cloneExtension
buildProject
createWorkspace
