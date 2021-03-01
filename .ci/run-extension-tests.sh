#!/bin/bash
# shellcheck disable=SC2016
#
# Copyright (c) 2012-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

set -e

function installDeps() {
    sudo pip install selenium
    wget https://github.com/mozilla/geckodriver/releases/download/v0.29.0/geckodriver-v0.29.0-linux64.tar.gz
    tar -xvzf geckodriver*
    chmod +x geckodriver
    sudo mv geckodriver /usr/local/bin/
}

function cloneExtension() {
    EXTENSION_PROJECT_NAME=$(basename "$EXTENSION_REPO")
    export EXTENSION_PROJECT_NAME

    mkdir -p /tmp/projects/"$EXTENSION_PROJECT_NAME"
    git clone "${EXTENSION_REPO}" /tmp/projects/"$EXTENSION_PROJECT_NAME"
    cd /tmp/projects/"$EXTENSION_PROJECT_NAME"
    git checkout tags/"${EXTENSION_REVISION}"
    git status
}

function prepareDevfile() {
    # Get Extension's ID
    EXTENSION_ID=$(yq -r --arg EXTENSION_REPO "$EXTENSION_REPO" '[.plugins[] | select(.repository.url == $EXTENSION_REPO)] | .[1] | .id' "$GITHUB_WORKSPACE"/che-theia-plugins.yaml)
    if [ "$EXTENSION_ID" == null ];
    then
        # If ID wasn't set in che-theia-plugins.yaml let's parse package.json and build ID as publisher/name 
        PACKAGE_JSON=/tmp/projects/$EXTENSION_PROJECT_NAME/package.json
        EXTENSION_NAME=$(jq -r '.name' "$PACKAGE_JSON")
        EXTENSION_PUBLISHER=$(jq -r '.publisher' "$PACKAGE_JSON")
        EXTENSION_ID=$EXTENSION_PUBLISHER/$EXTENSION_NAME
    fi
    EXTENSION_ID=$EXTENSION_ID/latest

    # Add Extension's ID into devfile template
    sed -i -e "s|@|$EXTENSION_ID|g" "$GITHUB_WORKSPACE"/.ci/templates/extension-tests-devfile.yaml
    echo ----- Devfile -----
    cat "$GITHUB_WORKSPACE"/.ci/templates/extension-tests-devfile.yaml
}

function compileExtension() {
    yarn install
    yarn compile
}

function prepareWorkspace() {
    chectl workspace:create --start --devfile=https://raw.githubusercontent.com/svor/che-vscode-extension-tests/main/devfile.yaml > workspace_url.txt
    WORKSPACE_URL=$(tail -n 1 workspace_url.txt)
    export WORKSPACE_URL
    echo Workspace URL is "$WORKSPACE_URL"

    pods=$(kubectl get pod -n admin-che -l che.workspace_id --field-selector=status.phase==Running 2>&1)
    while [ "$pods" == 'No resources found in admin-che namespace.'  ];
    do
        chectl workspace:list
        echo "Workspace is not ready"
        kubectl get pod -n admin-che
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

    ### Copy extension's sources into theia container
    copySources

    sleep 10

    # Start the python3 selenium script that will connect to the workspace to run tests
    python3 "$GITHUB_WORKSPACE"/.ci/tests-runner.py "${WORKSPACE_URL}"
}

function copySources() {
    echo "----- Copy Sources --------"    
    kubectl cp /tmp/projects/"$EXTENSION_PROJECT_NAME" admin-che/"${WORKSPACE_NAME}":/projects -c "$THEIA_IDE_CONTAINER_NAME"
    echo "----- Sources were copied --------"    
    ### Check if copy
    kubectl exec "${WORKSPACE_NAME}" -n admin-che -c "$THEIA_IDE_CONTAINER_NAME" -- ls -la /projects
}

function checkTestsLogs() {
    kubectl cp admin-che/"${WORKSPACE_NAME}":/projects/test.log /tmp/test.log -c "${THEIA_IDE_CONTAINER_NAME}"
    while ! grep -q "TESTS PASSED" /tmp/test.log && ! grep -q "TESTS FAILED" /tmp/test.log;
    do
        echo "Waiting for log file to be created and have TESTS FAILED or TESTS PASSED"
        sleep 10
        kubectl cp admin-che/"${WORKSPACE_NAME}":/projects/test.log /tmp/test.log -c "${THEIA_IDE_CONTAINER_NAME}"
    done

    cat /tmp/test.log

    # Test to see if the tests failed
    if grep -q "TESTS FAILED" /tmp/test.log;
    then
        exit 1
    fi
}

installDeps
cloneExtension
compileExtension
prepareDevfile
prepareWorkspace
checkTestsLogs
