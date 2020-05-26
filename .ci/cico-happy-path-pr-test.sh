#!/bin/bash

# Copyright (c) 2012-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

function getOpenshiftLogs() {
  mkdir -p /root/payload/report/oc-logs
  cd /root/payload/report/oc-logs
  for POD in $(oc get pods -o name); do
    for CONTAINER in $(oc get ${POD} -o jsonpath="{.spec.containers[*].name}"); do
      oc logs ${POD} -c ${CONTAINER} |tee $(echo ${POD}-${CONTAINER}.log | sed 's|pod/||g')
    done
  done
  echo "======== oc get events ========"
  oc get events | tee get_events.log
  echo "======== oc get all ========"
  oc get all | tee get_all.log
  oc get checluster -o yaml | tee get_checluster.log || true
}

createTestWorkspaceAndRunTest() {
  CHE_URL=$(oc get checluster eclipse-che -o jsonpath='{.status.cheURL}')
  ### Create workspace
  echo "====== Create test workspace ======"
  chectl workspace:create --start --access-token "$USER_ACCESS_TOKEN" --devfile=https://raw.githubusercontent.com/eclipse/che/master/tests/e2e/files/happy-path/happy-path-workspace.yaml

  ### Create directory for report
  cd /root/payload
  mkdir report
  REPORT_FOLDER=$(pwd)/report
  ### Run tests
  docker run --shm-size=1g --net=host  --ipc=host -v $REPORT_FOLDER:/tmp/e2e/report:Z \
  -e TS_SELENIUM_BASE_URL="$CHE_URL" \
  -e TS_SELENIUM_LOG_LEVEL=DEBUG \
  -e TS_SELENIUM_MULTIUSER=true \
  -e TS_SELENIUM_USERNAME="admin" \
  -e TS_SELENIUM_PASSWORD="admin" \
  -e TS_SELENIUM_DEFAULT_TIMEOUT=300000 \
  -e TS_SELENIUM_WORKSPACE_STATUS_POLLING=20000 \
  -e TS_SELENIUM_LOAD_PAGE_TIMEOUT=420000 \
  -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
  quay.io/eclipse/che-e2e:nightly || IS_TEST_FAILED=true
}

set -x

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
. $SCRIPT_DIR/cico_common.sh

SCRIPT_DIR=$(cd "$(dirname "$0")"; pwd)
export SCRIPT_DIR

# shellcheck disable=SC1090
. "${SCRIPT_DIR}"/../cico_functions.sh

load_jenkins_vars
install_deps

# Build & push.

export TAG="PR-${ghprbPullId}"
export IMAGE_NAME="quay.io/eclipse/che-plugin-registry:$TAG"
build_and_push

echo "=========== Build passed. Image is available on $IMAGE_NAME ==============="

# Install test deps
echo "========= Installing test dependencies =========="
installOC
installKVM
installAndStartMinishift
installJQ
echo "========= Test dependencies installed =========="

bash <(curl -sL https://www.eclipse.org/che/chectl/) --channel=next

cat >/tmp/che-cr-patch.yaml <<EOL
spec:
  server:
    pluginRegistryImage: $IMAGE_NAME
    selfSignedCert: true
  auth:
    updateAdminPassword: false
EOL

echo "======= Che cr patch ======="
cat /tmp/che-cr-patch.yaml

# Start Che

if chectl server:start --listr-renderer=verbose -a operator -p openshift --k8spodreadytimeout=360000 --che-operator-cr-patch-yaml=/tmp/che-cr-patch.yaml; then
    echo "Started succesfully"
    oc get checluster -o yaml
else
    getOpenshiftLogs
    archiveArtifacts "che-plugin-registry-prcheck"
    echo "Failed while starting chectl. Please check logs available in http://artifacts.ci.centos.org/devtools/che/che-plugin-registry-prcheck/${ghprbPullId}/"
    exit 1337
fi

#Run tests

obtainUserToken

createTestWorkspaceAndRunTest

getOpenshiftLogs

archiveArtifacts "che-plugin-registry-prcheck"

if [[ "$IS_TEST_FAILED" == "true" ]]; then 
  echo "Failed on running tests. Please check logs or contact QE team (e-mail:codereadyqe-workspaces-qe@redhat.com, Slack: #che-qe-internal, Eclipse mattermost: 'Eclipse Che QE'"
  echo "Logs should be availabe on http://artifacts.ci.centos.org/devtools/che/che-plugin-registry-prcheck/${ghprbPullId}/"
  exit 1
fi
