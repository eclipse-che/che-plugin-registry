#!/usr/bin/env bash
# Copyright (c) 2018 Red Hat, Inc.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html

set -x

function prepareCustomResourceFile() {
  cd /tmp
  wget https://raw.githubusercontent.com/eclipse/che-operator/master/deploy/crds/org_v1_che_cr.yaml -O custom-resource.yaml
  sed -i "s@tlsSupport: true@tlsSupport: false@g" /tmp/custom-resource.yaml
  cat /tmp/custom-resource.yaml
}

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
deployCheIntoCluster --chenamespace=che --che-operator-cr-yaml=/tmp/custom-resource.yaml
createTestUserAndObtainUserToken
downloadAndCheckoutBranch
downloadFiles
getAvailableDevfiles
createTestWorkspaceAndRunTest
echo "=========================== THIS IS POST TEST ACTIONS =============================="
archiveArtifacts "che-plugin-registry-test"
echo '=======================FAILURE STATUS=======================:'"$TESTS_PASSED"
if [[ "$TESTS_PASSED" == "false" ]]; then exit 1; fi
