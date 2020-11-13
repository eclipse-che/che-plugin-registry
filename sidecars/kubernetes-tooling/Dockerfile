# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM quay.io/eclipse/che-container-tools:1.0.0-8caea0f

ENV MINIKUBE_VERSION=v1.12.1

ADD etc/storage.conf ${HOME}/.config/containers/storage.conf
ADD etc/containers.conf ${HOME}/.config/containers/containers.conf
ADD etc/subuid /etc/subuid
ADD etc/subgid /etc/subgid

RUN export ARCH_MINIKUBE="$(uname -m)" && if [[ ${ARCH_MINIKUBE} == "x86_64" ]]; then export ARCH_MINIKUBE="amd64"; elif [[ ${ARCH_MINIKUBE} == "aarch64" ]]; \
      then export ARCH_MINIKUBE="arm64"; fi && \
    curl https://storage.googleapis.com/minikube/releases/${MINIKUBE_VERSION}/minikube-linux-${ARCH_MINIKUBE} -o /usr/local/bin/minikube && \
    chmod +x /usr/local/bin/minikube && \
    # buildah login requires writing to /run
    chgrp -R 0 /run && chmod -R g+rwX /run && \
    mkdir -p /var/tmp/containers/runtime && \
    chmod -R g+rwX /var/tmp/containers

ENV XDG_RUNTIME_DIR /var/tmp/containers/runtime
