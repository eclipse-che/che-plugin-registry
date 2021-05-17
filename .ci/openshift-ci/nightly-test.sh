#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

################################ !!!   IMPORTANT   !!! ################################
########### THIS JOB USE openshift ci operators workflows to run  #####################
##########  More info about how it is configured can be found here: https://docs.ci.openshift.org/docs/how-tos/testing-operator-sdk-operators #############
#######################################################################################################################################################

# exit immediately when a command fails
set -e
# only exit with zero if all commands of the pipeline exit successfully
set -o pipefail

# import common test functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# shellcheck source=./.ci/openshift-ci/common-functions.sh
source "${SCRIPT_DIR}"/common-functions.sh

runTests() {
  runTest "InstallPluginUsingUI" "install-plugin-test"
  runTest "JavaPlugin" "java11-plugin-test"
  runTest "PhpPlugin" "php-plugin-test"
  runTest "PythonPluginTest" "python-plugin-test"
  runTest "TypescriptPlugin" "typescript-debug-plugins"
  runTest "VscodeKubernetesPlugin" "nodejs-24lop"
  runTest "VscodeShellcheckPlugin" "nodejs-zmecm"
  runTest "VscodeValePlugin" "che-docs-test"
  runTest "VscodeXmlPlugin" "xml-plugin-test"
  runTest "VscodeYamlPlugin" "nodejs-zmecm"
}

setupTestEnvironment
runTests
finishReport
