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

sudo pip install yq

function getExtensionRepoAndRevision() {
    CHANGED_LINES=$(git diff -U0 HEAD "$(git merge-base HEAD origin/master)" che-theia-plugins.yaml | grep @@ | cut -d ' ' -f 3 | sed 's/+//')
    echo "$CHANGED_LINES"
    for number in $CHANGED_LINES
    do
        LINE=$(sed "$number!d" che-theia-plugins.yaml | xargs)
        echo --- LINE --- 
        echo "$LINE"
        if [[ $LINE == *"revision:"* ]]; then
            break
        fi
        exit 0
    done
    EXTENSION_REVISION=$(echo "$LINE" | cut -d ' ' -f 2)
    EXTENSION_REPO=$(yq -r --arg EXTENSION_REVISION "$EXTENSION_REVISION" '[.plugins[] | select(.repository.revision == $EXTENSION_REVISION )] | .[0] | .repository.url' che-theia-plugins.yaml)
    # export EXTENSION_REPO
    # export EXTENSION_REVISION

    echo --- REPOSITORY ---
    echo Extension repo is "$EXTENSION_REPO"
    echo --- REVISION ---
    echo Extension revision is "$EXTENSION_REVISION"
    echo "export EXTENSION_REPO=${EXTENSION_REPO}" > ~/.bashrc
    echo "export EXTENSION_REVISION=${EXTENSION_REVISION}" > ~/.bashrc
}

getExtensionRepoAndRevision