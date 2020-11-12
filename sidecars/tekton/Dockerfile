# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM golang:alpine AS builder
RUN apk update && apk add --no-cache git
WORKDIR $GOPATH
RUN cd src && git clone https://github.com/tektoncd/experimental && cd experimental/octant-plugin && \
    CGO_ENABLED=0 GOOS=linux go build -o $GOPATH/src/tekton-plugin -a -ldflags '-extldflags "-static"' .

FROM quay.io/eclipse/che-sidecar-kubernetes-tooling:1.2.1-6144144

ENV OCTANT_VERSION 0.16.0
ENV TEKTONCD_VERSION 0.13.0

RUN dnf install -y wget && \
    mkdir -p /home/theia/.octant/plugins && \
    wget https://github.com/vmware-tanzu/octant/releases/download/v${OCTANT_VERSION}/octant_${OCTANT_VERSION}_Linux-64bit.tar.gz && \
    tar -zxvf octant_${OCTANT_VERSION}_Linux-64bit.tar.gz && cd octant_${OCTANT_VERSION}_Linux-64bit && cp octant /usr/local/bin/ && \
    wget https://github.com/tektoncd/cli/releases/download/v${TEKTONCD_VERSION}/tkn_${TEKTONCD_VERSION}_Linux_x86_64.tar.gz  && \
    tar xvzf tkn_${TEKTONCD_VERSION}_Linux_x86_64.tar.gz -C /usr/local/bin/ tkn && \
    rm tkn_${TEKTONCD_VERSION}_Linux_x86_64.tar.gz

    
RUN mkdir -p /home/theia/.octant/plugins
COPY --from=builder /go/src/tekton-plugin /home/theia/.octant/plugins/
RUN chgrp -R 0 /home/theia/.octant && chmod -R g+rwX /home/theia/.octant
RUN chown -R 1724:root /home/theia/.octant
