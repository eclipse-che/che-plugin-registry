#!/usr/bin/env bash
# Copyright (c) 2018 Red Hat, Inc.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html

set -x

echo "========Starting PR Check test job $(date)========"
# shellcheck disable=SC1091
source .ci/functional-tests-utils.sh
# shellcheck disable=SC1091
source .ci/plugin-tests.sh
setupEnvs
installKVM
installDependencies
installCheCtl
installAndStartMinishift
createCert
loginToOpenshiftAndSetDevRole
prepareCustomResourceFile
deployCheIntoCluster
createTestUserAndObtainUserToken
downloadAndCheckoutBranch
downloadFiles
getAvailableDevfiles
createTestWorkspaceAndRunTest
echo "=========================== THIS IS POST TEST ACTIONS =============================="
archiveArtifacts "che-plugin-registry-test"
echo '=======================FAILURE STATUS=======================:'"$TESTS_PASSED"
if [[ "$TESTS_PASSED" == "false" ]]; then exit 1; fi
