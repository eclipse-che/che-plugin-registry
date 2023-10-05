#!/bin/bash
#
# Copyright (c) 2023 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# exit immediately when a command fails
set -ex
# only exit with zero if all commands of the pipeline exit successfully
set -o pipefail

export PUBLIC_REPO_URL=${PUBLIC_REPO_URL:-"https://github.com/chepullreq1/public-repo.git"}
export CHE_CODE_EDITOR_ID=che-incubator/che-code/latest

# import common test functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# shellcheck disable=SC1091,SC1090
source "${SCRIPT_DIR}"/common-functions.sh

trap "catchFinish" EXIT SIGINT

setupTestEnvironment "${OCP_NON_ADMIN_USER_NAME}"

# test starting workspace with che-code editor
testStartWorkspace "${PUBLIC_REPO_WORKSPACE_NAME}" "${PUBLIC_PROJECT_NAME}" "${PUBLIC_REPO_URL}" "${ADMIN_CHE_NAMESPACE}" "${CHE_CODE_EDITOR_ID}"
