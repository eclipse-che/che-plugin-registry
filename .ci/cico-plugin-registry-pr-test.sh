#!/bin/bash
# shellcheck disable=SC1091,SC1090
#
# Copyright (c)2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
set -e
set -x

#Download and import the "common-qe" functions
export IS_TESTS_FAILED="false"
DOWNLOADER_URL=https://raw.githubusercontent.com/eclipse/che/master/tests/.infra/centos-ci/common-qe/downloader.sh
curl $DOWNLOADER_URL -o downloader.sh
chmod u+x downloader.sh
. ./downloader.sh

setup_environment
setConfigProperty "test.workspace.devfile.url" "https://raw.githubusercontent.com/che-incubator/che-java-tests/master/devfile.yaml"

export TAG="PR-${ghprbPullId:?}"
export IMAGE_NAME="quay.io/eclipse/che-plugin-registry:$TAG"
CHE_SERVER_PATCH="$(cat <<EOL
spec:
  server:
    pluginRegistryImage: $IMAGE_NAME
    selfSignedCert: true
  auth:
    updateAdminPassword: false
    openShiftoAuth: false
EOL
)"

WORK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
. "${WORK_DIR}"/../cico_functions.sh
build_and_push

installChectl
yum install --assumeyes -d1 \
    patch \
    pcp \
    wget \
    bzip2 \
    python3 \
    firefox
  python3 -m pip install selenium
  wget https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-linux64.tar.gz
  tar -xvzf geckodriver*
  chmod +x geckodriver
  mv geckodriver /usr/local/bin/

startCheServer "$CHE_SERVER_PATCH"

createTestWorkspace > workspace_url.txt
workspace_url=$(tail -n 1 workspace_url.txt)
echo "$workspace_url"

oc project che
oc get namespace
oc get routes

pods=$(oc get pods --all-namespaces -l che.workspace_id --field-selector status.phase=Running 2>&1)
while [ "$pods" == 'No resources found.'  ];
do
    echo "No pod found with che.workspace_id"
    echo "Current available pods are"
    oc get pods
    echo "Current deployments are"
    oc get deployments
    oc get pods --all-namespaces -l che.workspace_id
    sleep 10
    pods=$(oc get pods --all-namespaces -l che.workspace_id --field-selector status.phase=Running 2>&1)
done

oc get pods
oc get pods -l che.workspace_id -o json
oc get pods --all-namespaces -l che.workspace_id -o json
oc get pods -l che.workspace_id

### Now we need to wait until we see some arguments in the output of the theia pod
### Once we see this correct output then we can proceed by running cat on the created file
### that lives in the workspace
workspace_name=$(oc get pods -l che.workspace_id -o json | jq '.items[0].metadata.name' | tr -d \")
theia_ide_container_name=$(oc get pods -l che.workspace_id -o json | jq '.items[0].metadata.annotations[]' | grep -P "theia-ide" | tr -d \")

echo "Workspace name is: "
echo "$workspace_name"
echo "Theia IDE Container Name is: "
echo "$theia_ide_container_name"

# Start the python3 selenium script that will connect to the workspace to run tests
python3 .ci/tests-runner.py "${workspace_url}"
sleep 20
cat geckodriver.log

oc cp che/"${workspace_name}":/projects/test.log ./test.log -c "${theia_ide_container_name}"
while ! grep -q "TESTS PASSED" test.log && ! grep -q "TESTS FAILED" test.log;
do
    echo "Waiting for log file to be created and have TESTS FAILED or TESTS PASSED"
    sleep 10
    oc cp che/"${workspace_name}":/projects/test.log ./test.log -c "${theia_ide_container_name}"
done

cat test.log

# Test to see if the tests failed, the TEST_PASSED default is set to true
if grep -q "TESTS FAILED" test.log;
then
    IS_TESTS_FAILED=false
fi

getOpenshiftLogs

archiveArtifacts "che-plugin-registry-prcheck"

if [ "$IS_TESTS_FAILED" == "true" ]; 
then
  exit 1;
fi
