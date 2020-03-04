#!/usr/bin/env bash

# Copyright (c) 2020 Red Hat, Inc.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html


####################################################
#                                                  #
#                Testing purposes                  #
#                                                  #
####################################################
# Just for testing purposes
ghprbAuthorRepoGitUrl=https://github.com/svor/che-plugin-registry.git
ghprbSourceBranch=sv/java0.57.0
ghprbPullId=387
ghprbActualCommitAuthor=svor

# Keeps track of the available devfiles that are set in getAvailableDevfiles
AVAILABLE_DEVFILES=()

# This will be replaced by the incoming meta.yaml files that are coming from the PR
FILE_PATHS=()

# Clone the branch from the author and then checkout their changes
function downloadAndCheckoutBranch() {

    echo "Starting to check out and clone the project"
    echo "Set variables are:"
    echo ${ghprbAuthorRepoGitUrl}
    echo ${ghprbSourceBranch}
    echo ${ghprbPullId}

    git clone ${ghprbAuthorRepoGitUrl} github
    cd github || exit
    git checkout ${ghprbSourceBranch}
    cd ..
}

function downloadFiles() {

    # Silently grab all the files that are in the PR
    for changedFile in $(curl -s https://api.github.com/repos/eclipse/che-plugin-registry/pulls/${ghprbPullId}/files | jq -r '.[] .filename')
    do

        # If they end with meta.yaml then those are the files we need to check
        if [[ $changedFile == *meta.yaml ]]
        then
            echo "Changed file"
            echo "$changedFile"
            FILE_PATHS+=("github/${changedFile}")
        fi
    done

}

DEVFILES_PRODUCED=0

function writeToYAMLTemplate() {
    # Write to generateName and projectName
    yq write -i .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml metadata.generateName "$1"
    yq write -i .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml projects[0].name "$1"

    # Write to the github project location
    yq write -i .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml projects[0].source.location "$2"

    # Write the tests reference to chePlugin
    yq write -i .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml components[0].reference "$3"
    
    # Write the changed meta.yaml reference to chePlugin 
    yq write -i .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml components[1].reference "$4"

    cat .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml
}

function getAvailableDevfiles() {

    for filePath in "${FILE_PATHS[@]}"
    do
        # Grab the values we need from samples.json
        for i in $(jq -c '.[]' .ci/samples.json)
        do

            # Grab the projectName, projectLocation, projectMetaYAML from the samples.json and remove the double quotes
            projectName=$(jq -c '.projectName' <<< "$i"  | tr -d '"')
            projectLocation=$(jq -c '.projectLocation' <<< "$i"  | tr -d '"')
            projectMetaYAML=$(jq -c '.projectMetaYAML' <<< "$i"  | tr -d '"')
 
            if grep -q "${projectName}" "${filePath}"
            then
                # Found ${projectName} in the meta.yaml
                cp .ci/sample-devfile.yaml .ci/sample-devfile-${DEVFILES_PRODUCED}.yaml

                # Remove the github from the file path that was added in downloadFiles
                filePathGithubStripped="${filePath//github\//$''}"   

                # Create a reference to the changed meta.yaml on github 
                rawReference="https://raw.githubusercontent.com/${ghprbActualCommitAuthor}/che-plugin-registry/${ghprbSourceBranch}/${filePathGithubStripped}"

                # Fill out all the required fields of the YAML Template
                writeToYAMLTemplate "$projectName" "$projectLocation" "$projectMetaYAML" "$rawReference"

                AVAILABLE_DEVFILES+=(".ci/sample-devfile-${DEVFILES_PRODUCED}.yaml")

                DEVFILES_PRODUCED=$((DEVFILES_PRODUCED + 1))
            fi
        done 
    done

}
