# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM quay.io/eclipse/che-container-tools:1.0.0-8caea0f

ENV HOME=/home/theia
ENV BZL_VERSION=3.2.0
ENV BUIDLERS_VERSION=3.0.0
ENV JAVA_VERSION=1.8.0
ENV JAVA_ARCH=x86_64

RUN dnf install -y wget gcc-c++ python3-devel gcc file which unzip findutils nodejs git patch dnf-plugins-core java-${JAVA_VERSION}-openjdk-devel.${JAVA_ARCH} && \
    dnf install -y python38 python

RUN cd /tmp && wget https://github.com/bazelbuild/bazel/releases/download/${BZL_VERSION}/bazel-${BZL_VERSION}-linux-x86_64 && mv bazel-${BZL_VERSION}-linux-x86_64 /bin/bazel && chmod +x /bin/bazel && \
    cd /tmp && wget https://github.com/bazelbuild/buildtools/releases/download/${BUIDLERS_VERSION}/buildifier && chmod 777 buildifier && mv buildifier /usr/bin/ && \
    cd /tmp && wget https://github.com/bazelbuild/buildtools/releases/download/${BUIDLERS_VERSION}/buildozer && chmod 777 buildozer && mv buildozer /usr/bin/
