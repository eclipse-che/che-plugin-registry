# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM debian:10-slim

ENV HOME=/home/theia
ENV PROTOC_VERSION=3.11.2

RUN echo "deb http://deb.debian.org/debian buster-backports main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install wget gnupg unzip -y && \
    apt-get update && \
    apt-get install -t buster-backports clangd-8 clang-8 clang-format-8 gdb -y && \
    apt-get clean && apt-get -y autoremove && rm -rf /var/lib/apt/lists/* && \
    update-alternatives --install /usr/bin/clang clang /usr/bin/clang-8 100 && \
    update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-8 100 && \
    update-alternatives --install /usr/bin/clangd clangd /usr/bin/clangd-8 100 && \
    update-alternatives --install /usr/bin/clang-format clang-format /usr/bin/clang-format-8 100

RUN cd /tmp && mkdir protoc-download && cd protoc-download && \
    wget https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-linux-x86_64.zip && \
    unzip protoc-${PROTOC_VERSION}-linux-x86_64.zip && rm -f protoc-${PROTOC_VERSION}-linux-x86_64.zip && \
    cp bin/protoc /usr/local/bin && mkdir /usr/include/protobuf &&  \
    cp -R include/* /usr/include/protobuf/ && cd ../ && rm -rf protoc-download 
    
RUN mkdir /projects ${HOME} && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
