#!/bin/bash

set -e
set -o pipefail

./start-services.sh

# install temporary nodejs
mkdir -p /tmp/opt/nodejs && curl -sL https://nodejs.org/download/release/v14.18.3/node-v14.18.3-linux-x64.tar.gz | tar xzf - -C /tmp/opt/nodejs --strip-components=1
# add path
export PATH=/tmp/opt/nodejs/bin:$PATH


# install the cli
npm install -g ovsx@0.7.1

# insert user
psql -c "INSERT INTO user_data (id, login_name) VALUES (1001, 'eclipse-che');"
psql -c "INSERT INTO personal_access_token (id, user_data, value, active, created_timestamp, accessed_timestamp, description) VALUES (1001, 1001, 'eclipse_che_token', true, current_timestamp, current_timestamp, 'extensions');"
psql -c "UPDATE user_data SET role='admin' WHERE user_data.login_name='eclipse-che';"


echo "Starting to publish extensions...."
export OVSX_REGISTRY_URL=http://localhost:9000
export OVSX_PAT=eclipse_che_token

containsElement () { for e in "${@:2}"; do [[ "$e" = "$1" ]] && return 0; done; return 1; }


# pull vsix from OpenVSX
mkdir -p /tmp/vsix
openVsxSyncFileContent=$(cat "/openvsx-sync.json")
numberOfExtensions=$(echo "${openVsxSyncFileContent}" | jq ". | length")
listOfPublishers=()
IFS=$'\n' 

for i in $(seq 0 "$((numberOfExtensions - 1))"); do
    vsixFullName=$(echo "${openVsxSyncFileContent}" | jq -r ".[$i].id")
    vsixVersion=$(echo "${openVsxSyncFileContent}" | jq -r ".[$i].version")
    vsixDownloadLink=$(echo "${openVsxSyncFileContent}" | jq -r ".[$i].download")

    # extract from the vsix name the publisher name which is the first part of the vsix name before dot
    vsixPublisher=$(echo "${vsixFullName}" | cut -d '.' -f 1)

    # replace the dot by / in the vsix name
    vsixName=$(echo "${vsixFullName}" | sed 's/\./\//g')

    # if download wasn't set, try to fetch from openvsx.org
    if [[ $vsixDownloadLink == null ]]; then
        # grab metadata for the vsix file
        # if version wasn't set, use latest
        if [[ $vsixVersion == null ]]; then
            vsixMetadata=$(curl -sLS "https://open-vsx.org/api/${vsixName}/latest")
            
            # if version wasn't set in json, grab it from metadata and add it into the file
            vsixVersion=$(echo "${vsixMetadata}" | jq -r '.version')
        else
            vsixMetadata=$(curl -sLS "https://open-vsx.org/api/${vsixName}/${vsixVersion}")
        fi 
        # check there is no error field in the metadata
        if [[ $(echo "${vsixMetadata}" | jq -r ".error") != null ]]; then
            echo "Error while getting metadata for ${vsixFullName}"
            echo "${vsixMetadata}"
            exit 1
        fi
        
        # extract the download link from the json metadata
        vsixDownloadLink=$(echo "${vsixMetadata}" | jq -r '.files.download')
        # get universal download link
        vsixUniversalDownloadLink=$(echo "${vsixMetadata}" | jq -r '.downloads."universal"')
        if [[ $vsixUniversalDownloadLink != null ]]; then
            vsixDownloadLink=$vsixUniversalDownloadLink
        fi
    fi

    echo "Downloading ${vsixDownloadLink} into ${vsixPublisher} folder..."

    vsixFilename="/tmp/vsix/${vsixFullName}-${vsixVersion}.vsix"

    # download the vsix file in the publisher directory
    curl -sL "${vsixDownloadLink}" -o "${vsixFilename}"

    # check if publisher is in the list of publishers
    if ! containsElement "${vsixPublisher}" "${listOfPublishers[@]}"; then
        listOfPublishers+=("${vsixPublisher}")
        # create namespace
        ovsx create-namespace "${vsixPublisher}"
    fi

    # publish the file
    ovsx publish "${vsixFilename}"

    # remove the downloaded file
    rm "${vsixFilename}"

done;


# disable the personal access token
psql -c "UPDATE personal_access_token SET active = false;"

# cleanup
rm -rf /tmp/opt/nodejs
rm -rf /tmp/extension_*.vsix
rm -rf /tmp/vsix
