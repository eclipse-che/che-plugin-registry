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

set -e
# only exit with zero if all commands of the pipeline exit successfully
set -o pipefail


export CHE_NAMESPACE=${CHE_NAMESPACE:-"eclipse-che"}
export ARTIFACTS_DIR=${ARTIFACT_DIR:-"/tmp/artifacts"}
export CHE_FORWARDED_PORT="8081"
export OCP_ADMIN_USER_NAME=${OCP_ADMIN_USER_NAME:-"admin"}
export OCP_NON_ADMIN_USER_NAME=${OCP_NON_ADMIN_USER_NAME:-"user"}
export OCP_LOGIN_PASSWORD=${OCP_LOGIN_PASSWORD:-"passw"}
export ADMIN_CHE_NAMESPACE=${OCP_ADMIN_USER_NAME}"-che"
export USER_CHE_NAMESPACE=${OCP_NON_ADMIN_USER_NAME}"-che"
export GIT_PROVIDER_USERNAME=${GIT_PROVIDER_USERNAME:-"chepullreq1"}
export PUBLIC_REPO_WORKSPACE_NAME=${PUBLIC_REPO_WORKSPACE_NAME:-"public-repo-wksp-testname"}
export PUBLIC_PROJECT_NAME=${PUBLIC_PROJECT_NAME:-"public-repo"}
export YAML_FILE_NAME=${YAML_FILE_NAME:-"devfile.yaml"}

provisionOpenShiftOAuthUser() {
  echo -e "[INFO] Provisioning Openshift OAuth user"
  htpasswd -c -B -b users.htpasswd "${OCP_ADMIN_USER_NAME}" "${OCP_LOGIN_PASSWORD}"
  htpasswd -b users.htpasswd "${OCP_NON_ADMIN_USER_NAME}" "${OCP_LOGIN_PASSWORD}"
  oc create secret generic htpass-secret --from-file=htpasswd="users.htpasswd" -n openshift-config
  oc apply -f ".ci/openshift-ci/htpasswdProvider.yaml"
  oc adm policy add-cluster-role-to-user cluster-admin "${OCP_ADMIN_USER_NAME}"

  echo -e "[INFO] Waiting for htpasswd auth to be working up to 5 minutes"
  CURRENT_TIME=$(date +%s)
  ENDTIME=$((CURRENT_TIME + 300))
  while [ "$(date +%s)" -lt $ENDTIME ]; do
      if oc login -u="${OCP_ADMIN_USER_NAME}" -p="${OCP_LOGIN_PASSWORD}" --insecure-skip-tls-verify=false; then
          break
      fi
      sleep 10
  done
}

createGithubSecret() {
  oc create namespace "eclipse-che"
  oc apply -f .ci/openshift-ci/github-conf.yaml
}

createCustomResourcesFile() {
  cat > custom-resources.yaml <<-END
apiVersion: org.eclipse.che/v2
spec:
  components:
    pluginRegistry:
      deployment:
        containers:
          - image: '${PLUGIN_REGISTRY_IMAGE}'
            imagePullPolicy: Always
END

  echo "Generated custom resources file"
  cat custom-resources.yaml
}

deployChe() {
  chectl server:deploy --che-operator-cr-patch-yaml=custom-resources.yaml \
                       --platform=openshift \
                       --telemetry=off \
                       --batch
}

# this command starts port forwarding between the local machine and the che-host service in the OpenShift cluster.
forwardPortToService() {
  oc port-forward service/che-host ${CHE_FORWARDED_PORT}:8080 -n "${CHE_NAMESPACE}" &
  sleep 3s
}

killProcessByPort() {
  fuser -k ${CHE_FORWARDED_PORT}/tcp
}

requestFactoryResolverGitRepoUrl() {
  GIT_REPO_URL=$1
  CLUSTER_ACCESS_TOKEN=$(oc whoami -t)

  curl -i -X 'POST' \
    http://localhost:${CHE_FORWARDED_PORT}/api/factory/resolver \
    -H 'accept: */*' \
    -H "Authorization: Bearer ${CLUSTER_ACCESS_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d '{
    "url": "'"${GIT_REPO_URL}"'"
  }'
}

testFactoryResolver() {
  PUBLIC_REPO_URL=$1

  echo "[INFO] Check factory resolver for public repository"
  if requestFactoryResolverGitRepoUrl "${PUBLIC_REPO_URL}" | grep "HTTP/1.1 200"; then
    echo "[INFO] Factory resolver returned 'HTTP/1.1 200' status code."
  else
    echo "[ERROR] Factory resolver returned wrong status code. Expected: HTTP/1.1 200."
    exit 1
  fi
}

requestProvisionNamespace() {
  CLUSTER_ACCESS_TOKEN=$(oc whoami -t)

  curl -i -X 'POST' \
    http://localhost:${CHE_FORWARDED_PORT}/api/kubernetes/namespace/provision \
    -H 'accept: application/json' \
    -H "Authorization: Bearer ${CLUSTER_ACCESS_TOKEN}" \
    -d ''
}

initUserNamespace() {
  OCP_USER_NAME=$1

  echo "[INFO] Initialize user namespace"
  oc login -u="${OCP_USER_NAME}" -p="${OCP_LOGIN_PASSWORD}" --insecure-skip-tls-verify=false
  if requestProvisionNamespace | grep "HTTP/1.1 200"; then
    echo "[INFO] Request provision user namespace returned 'HTTP/1.1 200' status code."
  else
    echo "[ERROR] Request provision user namespace returned wrong status code. Expected: HTTP/1.1 200"
    exit 1
  fi
}

testProjectIsCloned() {
  PROJECT_NAME=$1
  OCP_USER_NAMESPACE=$2

  WORKSPACE_POD_NAME=$(oc get pods -n "${OCP_USER_NAMESPACE}" | grep workspace | awk '{print $1}')
  if oc exec -it -n "${OCP_USER_NAMESPACE}" "${WORKSPACE_POD_NAME}" -- test -f /projects/"${PROJECT_NAME}"/"${YAML_FILE_NAME}"; then
    echo "[INFO] Project file /projects/${PROJECT_NAME}/${YAML_FILE_NAME} exists."
  else
    echo "[INFO] Project file /projects/${PROJECT_NAME}/${YAML_FILE_NAME} is absent."
    return 1
  fi
}

runTestWorkspaceWithGitRepoUrl() {
  WS_NAME=$1
  PROJECT_NAME=$2
  GIT_REPO_URL=$3
  OCP_USER_NAMESPACE=$4

  oc project "${OCP_USER_NAMESPACE}"
  cat .ci/openshift-ci/devworkspace-test.yaml > devworkspace-test.yaml

  # patch the devworkspace-test.yaml file
  sed -i "s#ws-name#${WS_NAME}#g" devworkspace-test.yaml
  sed -i "s#project-name#${PROJECT_NAME}#g" devworkspace-test.yaml
  sed -i "s#git-repo-url#${GIT_REPO_URL}#g" devworkspace-test.yaml

  cat devworkspace-test.yaml

  oc apply -f devworkspace-test.yaml -n "${OCP_USER_NAMESPACE}"
  oc wait -n "${OCP_USER_NAMESPACE}" --for=condition=Ready dw "${WS_NAME}" --timeout=360s
  echo "[INFO] Test workspace is run"
}

deleteTestWorkspace() {
  WS_NAME=$1
  OCP_USER_NAMESPACE=$2

  oc delete dw "${WS_NAME}" -n "${OCP_USER_NAMESPACE}"
}

testClonePublicRepoNoPatOAuth() {
  WS_NAME=$1
  PROJECT_NAME=$2
  GIT_REPO_URL=$3
  OCP_USER_NAMESPACE=$4

  runTestWorkspaceWithGitRepoUrl "${WS_NAME}" "${PROJECT_NAME}" "${GIT_REPO_URL}" "${OCP_USER_NAMESPACE}"
  echo "[INFO] Check the public repository is cloned"
  testProjectIsCloned "${PROJECT_NAME}" "${OCP_USER_NAMESPACE}" || \
  { echo "[ERROR] Project file /projects/${PROJECT_NAME}/${YAML_FILE_NAME} should be present." && exit 1; }
  deleteTestWorkspace "${WS_NAME}" "${OCP_USER_NAMESPACE}"
}

setupTestEnvironment() {
  OCP_USER_NAME=$1

  provisionOpenShiftOAuthUser
  createCustomResourcesFile
  deployChe
  forwardPortToService
  initUserNamespace "${OCP_USER_NAME}"
}
