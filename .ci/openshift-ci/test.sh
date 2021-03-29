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


# OPERATOR_REPO="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
# echo $OPERATOR_REPO
# source "${OPERATOR_REPO}"/common.sh
# source "${OPERATOR_REPO}"/oauth-provision.sh

# Stop execution on any error
# trap "catchFinish" EXIT SIGINT

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

runTest() {
  createCustomResourcesFile
  deployChe
#   waitDevWorkspaceControllerStarted

#   # wait for 2 min for devworkspace-controller ready to work.
#   sleep 120
#   createWorkspaceDevWorkspaceController
#   waitWorkspaceStartedDevWorkspaceController 
#   sleep 120
#   oc get pods -n ${NAMESPACE}
#   oc get routes -n ${NAMESPACE}

#   wsname=$(oc get pods  | grep workspace | awk '{print $1}')
#   oc logs $wsname -c theia-ide
#   oc logs $wsname -c terminal
#   oc get events -n ${NAMESPACE}




  # patch pod.yaml 
  wget https://gist.githubusercontent.com/Ohrimenko1988/cf2ca8040f2e9fabaa4557c87c89181e/raw/a77180ae40e630acc204076689397d5ebbf604ce/happy-path-pod.yaml
 
 
  ECLIPSE_CHE_URL=http://$(oc get route -n "eclipse-che" che -o jsonpath='{.status.ingress[0].host}')
#   TS_SELENIUM_DEVWORKSPACE_URL="https://$(oc get route -n "${NAMESPACE}" | grep theia/ | awk '{print $2}')/theia/"
  sed -i "s@CHE_URL@${ECLIPSE_CHE_URL}@g" happy-path-pod.yaml
  sed -i "s@userstory-sample@${USERSTORY}@g" happy-path-pod.yaml

#   sed -i "s@WORKSPACE_ROUTE@${TS_SELENIUM_DEVWORKSPACE_URL}@g" happy-path-pod.yaml
  cat happy-path-pod.yaml



  oc create namespace $TEST_POD_NAMESPACE

  oc apply -f happy-path-pod.yaml
  # wait for the pod to start
  while true; do
    sleep 3
    PHASE=$(oc get pod -n ${TEST_POD_NAMESPACE} happy-path-che \
        --template='{{ .status.phase }}')
    if [[ ${PHASE} == "Running" ]]; then
        break
    fi
  done

  # wait for the test to finish
  oc logs -n ${TEST_POD_NAMESPACE} happy-path-che -c happy-path-test -f

  # just to sleep
  sleep 3

  # download the test results
  # mkdir -p tmp/
  # oc rsync -n ${TEST_POD_NAMESPACE} happy-path-che:/tmp/e2e/report/ ${ARTIFACTS_DIR} -c download-reports
  # oc exec -n ${TEST_POD_NAMESPACE} happy-path-che -c download-reports -- touch ${ARTIFACTS_DIR}/done



  # download the test results
  mkdir -p /tmp/e2e
  oc rsync -n ${TEST_POD_NAMESPACE} ${HAPPY_PATH_POD_NAME}:/tmp/e2e/report/ /tmp/e2e -c download-reports
  oc exec -n ${TEST_POD_NAMESPACE} ${HAPPY_PATH_POD_NAME} -c download-reports -- touch /tmp/done

  mkdir -p ${ARTIFACTS_DIR}
  cp -r /tmp/e2e ${ARTIFACTS_DIR}
}

# initDefaults
# installYq
runTest
