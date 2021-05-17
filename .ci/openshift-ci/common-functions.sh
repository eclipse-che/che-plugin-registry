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

export RAM_MEMORY=8192
export TEST_POD_NAMESPACE="plugin-registry-test"
export PLUGIN_REGISTRY_IMAGE=${CHE_PLUGIN_REGISTRY}
export TEST_CONTAINER_NAME="plugins-test"
export ARTIFACTS_DIR=${ARTIFACT_DIR:-"/tmp/artifacts-che"}
export TESTS_STATUS=()
export TEST_RESULT="PASSED"

# turn off telemetry
mkdir -p "${HOME}"/.config/chectl
echo "{\"segment.telemetry\":\"off\"}" > "${HOME}"/.config/chectl/config.json

provisionOpenShiftOAuthUser() {
  htpasswd -c -B -b users.htpasswd user user
  oc create secret generic htpass-secret --from-file=htpasswd="users.htpasswd" -n openshift-config
  oc apply -f ".ci/openshift-ci/htpasswdProvider.yaml"
  oc adm policy add-cluster-role-to-user cluster-admin user

  echo -e "[INFO] Waiting for htpasswd auth to be working up to 5 minutes"
  CURRENT_TIME=$(date +%s)
  ENDTIME=$((CURRENT_TIME + 300))
  while [ "$(date +%s)" -lt $ENDTIME ]; do
      if oc login -u user -p user --insecure-skip-tls-verify=false; then
          break
      fi
      sleep 10
  done
}

createCustomResourcesFile() {
  cat > custom-resources.yaml <<-END
spec:
  auth:
    updateAdminPassword: false
  server:
    pluginRegistryImage: ${PLUGIN_REGISTRY_IMAGE}
    pluginRegistryPullPolicy: IfNotPresent
    customCheProperties:
      CHE_LIMITS_USER_WORKSPACES_RUN_COUNT: '-1'
      CHE_LIMITS_WORKSPACE_IDLE_TIMEOUT: '900000'
      CHE_INFRA_KUBERNETES_WORKSPACE__UNRECOVERABLE__EVENTS: 'Failed Scheduling,Failed to pull image'
      CHE_WORKSPACE_SIDECAR_IMAGE__PULL__POLICY: IfNotPresent
      CHE_WORKSPACE_PLUGIN__BROKER_PULL__POLICY: IfNotPresent
      CHE_INFRA_KUBERNETES_PVC_JOBS_IMAGE_PULL__POLICY: IfNotPresent
END

  echo "Generated custom resources file"
  cat custom-resources.yaml
}

deployChe() {
  chectl server:deploy --che-operator-cr-patch-yaml=custom-resources.yaml --platform=openshift --installer=operator --batch
}

patchTestPodConfig(){
  TEST_USERSTORY="$1"
  TEST_POD_NAME="$2"
  # obtain the basic test pod config
  cat .ci/openshift-ci/plugins-test-pod.yaml > plugins-test-pod.yaml

  # Patch the basic test pod config
  ECLIPSE_CHE_URL=http://$(oc get route -n "eclipse-che" che -o jsonpath='{.status.ingress[0].host}')
  sed -i "s@CHE_URL@${ECLIPSE_CHE_URL}@g" plugins-test-pod.yaml
  sed -i "s@TEST_USERSTORY@${TEST_USERSTORY}@g" plugins-test-pod.yaml
  sed -i "s@POD_NAME@${TEST_POD_NAME}@g" plugins-test-pod.yaml

  cat plugins-test-pod.yaml
}

downloadTestResults() {
  TEST_USERSTORY="$1"
  TEST_POD_NAME="$2"
  mkdir -p /tmp/e2e
  oc rsync -n ${TEST_POD_NAMESPACE} "${TEST_POD_NAME}":/tmp/e2e/report/ /tmp/e2e -c download-reports
  oc exec -n ${TEST_POD_NAMESPACE} "${TEST_POD_NAME}" -c download-reports -- touch /tmp/e2e/done

  mkdir -p "${ARTIFACTS_DIR}"
  cp -r /tmp/e2e "${ARTIFACTS_DIR}/${TEST_USERSTORY}"
  rm -rf /tmp/e2e

  chectl server:logs --chenamespace="eclipse-che" --directory="${ARTIFACTS_DIR}/${TEST_USERSTORY}"
  oc get checluster -o yaml -n "eclipse-che" > "${ARTIFACTS_DIR}/${TEST_USERSTORY}/che-cluster.yaml"

  TEST_POD_EXIT_CODE=$(oc logs -n ${TEST_POD_NAMESPACE} "${TEST_POD_NAME}" -c ${TEST_CONTAINER_NAME} | grep EXIT_CODE)

  echo "The ${TEST_USERSTORY} pod exit code: ${TEST_POD_EXIT_CODE}"

  if [[ ${TEST_POD_EXIT_CODE} == "+ EXIT_CODE=1" ]]; then
    echo "[ERROR] The ${TEST_USERSTORY} plugin test failed."
    STATUS_MESSAGE="${TEST_USERSTORY}-------FAILED"
    TESTS_STATUS+=("$STATUS_MESSAGE")
    TEST_RESULT="FAILED"
  else
    STATUS_MESSAGE="${TEST_USERSTORY}-------PASSED"
    TESTS_STATUS+=("${STATUS_MESSAGE}")
  fi
  
}

finishReport() {
  # report test results

  echo ""
  echo ""
  echo "==================== FINISH REPORT ========================"
  echo ""

  for RESULT in "${TESTS_STATUS[@]}"; do
    echo "    ${RESULT}"
  done

  if [[ ${TEST_RESULT} == "FAILED" ]]; then
    echo ""
    echo "[ERROR] The plugin tests failed."
    echo ""
    echo "==========================================================="
    echo ""
    echo ""

    exit 1

  fi

  echo "The plugin tests successfuly passed."
  echo ""
  echo "==========================================================="
  echo ""
  echo ""

  exit 0

}

cleanUpAfterTest(){
  TEST_POD_NAME="$1"
  
  # delete test pod
  oc delete pod -n "${TEST_POD_NAMESPACE}" "${TEST_POD_NAME}"

  # get token
  chectl auth:login -n eclipse-che

  # get workspace ID
  WORKSPACE_ID=$(chectl workspace:list -n eclipse-che | grep "${TEST_POD_NAME}" | awk '{print $1}')
  echo "Workspace ID: ${WORKSPACE_ID}"

  # stop workspace
  chectl workspace:stop -n eclipse-che "${WORKSPACE_ID}"

  # delete workspace
  chectl workspace:delete -n eclipse-che "${WORKSPACE_ID}"
}

runTest() {
  TEST_USERSTORY="$1"
  TEST_POD_NAME="$2"

  patchTestPodConfig "${TEST_USERSTORY}" "${TEST_POD_NAME}"

  # Create the test pod
  oc apply -f plugins-test-pod.yaml

  # wait for the pod to start
  while true; do
    sleep 3
    PHASE=$(oc get pod -n ${TEST_POD_NAMESPACE} "${TEST_POD_NAME}" \
        --template='{{ .status.phase }}')
    if [[ ${PHASE} == "Running" ]]; then
        break
    fi
  done

  # wait for the test to finish
  oc logs -n ${TEST_POD_NAMESPACE} "${TEST_POD_NAME}" -c ${TEST_CONTAINER_NAME} -f

  # just to sleep
  sleep 3

  downloadTestResults "${TEST_USERSTORY}" "${TEST_POD_NAME}"
  cleanUpAfterTest "${TEST_POD_NAME}"
}

createTestPodNamespace(){
  oc create namespace $TEST_POD_NAMESPACE
}

setupTestEnvironment(){
  provisionOpenShiftOAuthUser
  createCustomResourcesFile
  deployChe
  createTestPodNamespace
}
