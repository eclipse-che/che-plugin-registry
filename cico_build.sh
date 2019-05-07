#!/bin/bash
#
# Copyright (c) 2012-2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Output command before executing
set -x

# Exit on error
set -e

# Source environment variables of the jenkins slave
# that might interest this worker.
function load_jenkins_vars() {
  if [ -e "jenkins-env.json" ]; then
    eval "$(./env-toolkit load -f jenkins-env.json \
            DEVSHIFT_TAG_LEN \
            QUAY_USERNAME \
            QUAY_PASSWORD \
            JENKINS_URL \
            GIT_BRANCH \
            GIT_COMMIT \
            BUILD_NUMBER \
            ghprbSourceBranch \
            ghprbActualCommit \
            BUILD_URL \
            ghprbPullId)"
  fi
}

function install_deps() {
  # We need to disable selinux for now, XXX
  /usr/sbin/setenforce 0  || true

  # Get all the deps in
  yum install -y yum-utils device-mapper-persistent-data lvm2
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  yum install -y docker-ce \
    git

  service docker start

  echo 'CICO: Dependencies installed'
}

function tag_push() {
  local TARGET=$1
  docker tag "${IMAGE}" "$TARGET"
  docker push "$TARGET"
}

function deploy() {
  TARGET=${TARGET:-"centos"}
  REGISTRY="quay.io"

  if [ "$TARGET" == "rhel" ]; then
    DOCKERFILE="Dockerfile.rhel"
    IMAGE="rhel-che-plugin-registry"
  else
    DOCKERFILE="Dockerfile"
    IMAGE="che-plugin-registry"
  fi

  if [ -n "${QUAY_USERNAME}" ] && [ -n "${QUAY_PASSWORD}" ]; then
    docker login -u "${QUAY_USERNAME}" -p "${QUAY_PASSWORD}" "${REGISTRY}"
  else
    echo "Could not login, missing credentials for the registry"
  fi

  # Let's deploy
  docker build -t ${IMAGE} -f ${DOCKERFILE} .

  TAG=$(echo "$GIT_COMMIT" | cut -c1-"${DEVSHIFT_TAG_LEN}")

  tag_push "${REGISTRY}/openshiftio/$IMAGE:$TAG"
  tag_push "${REGISTRY}/openshiftio/$IMAGE:latest"
  echo 'CICO: Image pushed, ready to update deployed app'
}

function cico_setup() {
  load_jenkins_vars;
  install_deps;
}
cico_setup
deploy
