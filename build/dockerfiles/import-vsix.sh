#!/bin/bash

set -e
set -o pipefail

./start-services.sh

# install temporary nodejs
mkdir -p /tmp/opt/nodejs && curl -sL https://nodejs.org/download/release/v18.16.1/node-v18.16.1-linux-x64.tar.gz | tar xzf - -C /tmp/opt/nodejs --strip-components=1
# add path
export PATH=/tmp/opt/nodejs/bin:$PATH


# install the cli
npm install -g ovsx@0.8.2

# insert user
psql -c "INSERT INTO user_data (id, login_name) VALUES (1001, 'eclipse-che');"
psql -c "INSERT INTO personal_access_token (id, user_data, value, active, created_timestamp, accessed_timestamp, description) VALUES (1001, 1001, 'eclipse_che_token', true, current_timestamp, current_timestamp, 'extensions');"
psql -c "UPDATE user_data SET role='admin' WHERE user_data.login_name='eclipse-che';"


echo "Starting to publish extensions...."
export OVSX_REGISTRY_URL=http://localhost:9000
export OVSX_PAT=eclipse_che_token

containsElement () { for e in "${@:2}"; do [[ "$e" = "$1" ]] && return 0; done; return 1; }

vsixMetadata="" #now global so it can be set/checked via function
getMetadata(){
    vsixName=$1
    key=$2

    # check there is no error field in the metadata and retry if there is
    for j in 1 2 3 4 5
    do
        vsixMetadata=$(curl -sLS "https://open-vsx.org/api/${vsixName}/${key}")
        if [[ $(echo "${vsixMetadata}" | jq -r ".error") != null ]]; then
            echo "Attempt $j/5: Error while getting metadata for ${vsixName} version ${key}"

            if [[ $j -eq 5 ]]; then
                echo "[ERROR] Maximum of 5 attempts reached - must exit!"
                exit 1
            fi
            continue
        else
            break
        fi
    done
}

# pull vsix from OpenVSX
mkdir -p /tmp/vsix
openVsxSyncFileContent=$(cat "/openvsx-sync.json")
numberOfExtensions=$(echo "${openVsxSyncFileContent}" | jq ". | length")
listOfPublishers=()
IFS=$'\n' 

base_dir=$(cd "$(dirname "$0")"; pwd)
if [[ -f "${base_dir%/*/*}/VERSION" ]]; then
  VERSION="${base_dir%/*/*}/VERSION"
  echo "Load file with the Eclipse Che version"
else
  echo "File with the current Eclipse Che version not found"
  exit 1
fi

currentVersion=$(head -n 1 "${VERSION}")

if [[ $currentVersion == *-SNAPSHOT* ]]; then
  currentVersion=main
fi

codeVersion=$(curl -sSlko- https://raw.githubusercontent.com/che-incubator/che-code/"${currentVersion}"/code/package.json | jq -r '.version')
echo "Che Code version=${codeVersion}"

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
            getMetadata "${vsixName}" "latest"
            # if version wasn't set in json, grab it from metadata and add it into the file
            # get all versions of the extension
            allVersions=$(echo "${vsixMetadata}" | jq -r '.allVersions')
            key_value_pairs=$(echo "$allVersions" | jq -r 'to_entries[] | [ .key, .value ] | @tsv')
            
            # go through all versions of the extension to find the latest stable version that is compatible with the VS Code version
            resultedVersion=null
            while IFS=$'\t' read -r key value; do
                # get metadata for the version
                getMetadata "${vsixName}" "${key}"
      
                # check if the version is pre-release
                preRelease=$(echo "${vsixMetadata}" | jq -r '.preRelease')
                if [[ $preRelease == true ]]; then
                    echo "Skipping pre-release version ${value}"
                    continue
                fi

                # extract the engine version from the json metadata
                vscodeEngineVersion=$(echo "${vsixMetadata}" | jq -r '.engines.vscode')
                # remove ^ from the engine version
                vscodeEngineVersion="${vscodeEngineVersion//^/}"
                # remove >= from the engine version
                vscodeEngineVersion="${vscodeEngineVersion//>=/}"
                # replace x by 0 in the engine version
                vscodeEngineVersion="${vscodeEngineVersion//x/0}"
                # check if the extension's engine version is compatible with the code version
                # if the extension's engine version is ahead of the code version, check a next version of the extension
                if [[  "$vscodeEngineVersion" = "$(echo -e "$vscodeEngineVersion\n$codeVersion" | sort -V | head -n1)" ]]; then
                    #VS Code version >= Engine version, can proceed."
                    resultedVersion=$(echo "${vsixMetadata}" | jq -r ".version")
                    break
                else 
                    echo "Skipping ${value}, it is not compatible with VS Code editor $codeVersion"
                    continue
                fi
            done <<< "$key_value_pairs"

            if [[ $resultedVersion == null ]]; then
                echo "[ERROR] No stable version of $vsixFullName is compatible with VS Code editor verision $codeVersion; must exit!"
                exit 1
            else
                vsixVersion=$resultedVersion
            fi
        else
            getMetadata "${vsixName}" "${vsixVersion}"
        fi 
        
        # extract the download link from the json metadata
        vsixDownloadLink=$(echo "${vsixMetadata}" | jq -r '.files.download')
        # get universal download link
        vsixUniversalDownloadLink=$(echo "${vsixMetadata}" | jq -r '.downloads."universal"')
        if [[ $vsixUniversalDownloadLink != null ]]; then
            vsixDownloadLink=$vsixUniversalDownloadLink
        else
            # get linux download link
            vsixLinuxDownloadLink=$(echo "${vsixMetadata}" | jq -r '.downloads."linux-x64"')
            if [[ $vsixLinuxDownloadLink != null ]]; then
                vsixDownloadLink=$vsixLinuxDownloadLink
            fi
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
