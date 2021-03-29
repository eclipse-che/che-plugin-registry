#!/bin/bash
#
# Copyright (c) 2012-2021 Red Hat, Inc.
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
# error on unset variables
set -u

export RAM_MEMORY=8192
export TEST_POD_NAMESPACE="devworkspace-project"
export PLUGIN_REGISTRY_IMAGE=${CHE_PLUGIN_REGISTRY}
export HAPPY_PATH_POD_NAME="happy-path-che"
export ARTIFACTS_DIR=${ARTIFACT_DIR:-"/tmp/artifacts-che"}

createCustomResourcesFile() {
  cat > custom-resources.yaml <<-END
spec:
  auth:
    updateAdminPassword: false
  server:
    pluginRegistryImage: ${PLUGIN_REGISTRY_IMAGE}
    pluginRegistryPullPolicy: IfNotPresent
    customCheProperties:
      CHE_WORKSPACE_SIDECAR_IMAGE__PULL__POLICY: IfNotPresent
      CHE_WORKSPACE_PLUGIN__BROKER_PULL__POLICY: IfNotPresent
      CHE_INFRA_KUBERNETES_PVC_JOBS_IMAGE_PULL__POLICY: IfNotPresent
END
    
    echo "Generated custom resources file"
    cat custom-resources.yaml
}

deployChe() {
    chectl server:deploy  --che-operator-cr-patch-yaml=custom-resources.yaml --telemetry=off --workspace-engine=dev-workspace --platform=openshift --installer=operator --batch
}

createCustomResourcesFile
deployChe
