# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM alpine:3.12.1

ENV HOME=/home/theia

RUN mkdir /projects ${HOME} && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

RUN apk --no-cache add openjdk11-jre-headless --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community && \
    apk --no-cache add bash curl procps nss

WORKDIR /projects

ENV JAVA_HOME=/usr/lib/jvm/default-jvm/ \
    SBT_VERSION="1.3.10" \
    METALS_VERSION="0.9.0+10-f3f3e535-SNAPSHOT"

RUN mkdir -p $HOME/.cache && ln -s $HOME/.cache /root/.cache && \
    mkdir -p $HOME/.ivy2 && ln -s $HOME/.ivy2 /root/.ivy2 && \
    mkdir -p $HOME/.sbt && ln -s $HOME/.sbt /root/.sbt && \
    curl -Ls https://raw.githubusercontent.com/paulp/sbt-extras/master/sbt > /usr/local/bin/sbt && \
    chmod 0755 /usr/local/bin/sbt && \
    sbt -sbt-version $SBT_VERSION -212 -sbt-create about && \
    rm -Rf ./* && \
    curl -Ls https://raw.githubusercontent.com/coursier/coursier/gh-pages/coursier > /usr/local/bin/coursier && \
    chmod 0755 /usr/local/bin/coursier && \
    coursier launch -r sonatype:snapshots org.scalameta:metals_2.12:$METALS_VERSION --main scala.meta.metals.DownloadDependencies

ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
