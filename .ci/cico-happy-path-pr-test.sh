#!/bin/bash
# shellcheck disable=SC1091,SC1090
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
set -x

#Download and import the "common-qe" functions
export IS_TESTS_FAILED="false"
DOWNLOADER_URL=https://raw.githubusercontent.com/eclipse/che/master/tests/.infra/centos-ci/common-qe/downloader.sh
curl $DOWNLOADER_URL -o downloader.sh
chmod u+x downloader.sh
. ./downloader.sh

setup_environment

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

startCheServer "$CHE_SERVER_PATCH"

createTestWorkspace

runTest

getOpenshiftLogs

archiveArtifacts "che-plugin-registry-prcheck"

if [ "$IS_TESTS_FAILED" == "true" ]; then
  exit 1;
fi
