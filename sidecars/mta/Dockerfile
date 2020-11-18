# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM quay.io/eclipse/che-sidecar-java:11-86274e3

RUN apk add --no-cache bash

ENV MTA_VERSION=5.1.0.Alpha1 \
    MTA_ROOT=$HOME/mta
   
ENV MTA_HOME=${MTA_ROOT}/mta-cli-${MTA_VERSION}
ENV PATH=${PATH}:${MTA_HOME}/bin

RUN mkdir -p $HOME/mta

RUN cd ${MTA_ROOT} && wget https://repo1.maven.org/maven2/org/jboss/windup/mta-cli/${MTA_VERSION}/mta-cli-${MTA_VERSION}-offline.zip

RUN unzip -d ${MTA_ROOT} ${MTA_ROOT}/mta-cli-${MTA_VERSION}-offline.zip && \
    rm -f ${MTA_ROOT}/mta-cli-${mta_VERSION}-offline.zip
