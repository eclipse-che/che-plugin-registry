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
    apk --no-cache add bash curl git procps nss

WORKDIR /projects

ENV JAVA_HOME=/usr/lib/jvm/default-jvm/ \
    METALS_VERSION="0.9.5+12-c5a9a2ac-SNAPSHOT"

RUN mkdir -p $HOME/.cache && ln -s $HOME/.cache /root/.cache && \
    mkdir -p $HOME/.ivy2 && ln -s $HOME/.ivy2 /root/.ivy2 && \
    mkdir -p $HOME/.sbt && ln -s $HOME/.sbt /root/.sbt && \
    git clone https://github.com/sideeffffect/console-scala-simple.git && \
    cd console-scala-simple && \
    ./sbt check && \
    cd .. && \
    rm -Rf console-scala-simple && \
    curl -Ls https://git.io/coursier-cli > /usr/local/bin/cs && \
    chmod 0755 /usr/local/bin/cs && \
    cs launch -r sonatype:snapshots org.scalameta:metals_2.12:$METALS_VERSION --main scala.meta.metals.DownloadDependencies && \
    du -h -d 2 $HOME/.sbt/ && \
    du -h -d 2 $HOME/.ivy2/ && \
    du -h -d 7 $HOME/.cache/ && \
    echo "Cache warmed up!"

ADD etc/entrypoint.sh /entrypoint.sh

RUN for f in "/projects" "$HOME/.cache" "$HOME/.ivy2" "$HOME/.sbt"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
