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
    apk --no-cache add procps nss

WORKDIR /projects

ENV JAVA_HOME=/usr/lib/jvm/default-jvm/

RUN mkdir -p $HOME/.cache && ln -s $HOME/.cache /root/.cache && \
    mkdir -p $HOME/.ivy2 && ln -s $HOME/.ivy2 /root/.ivy2 && \
    mkdir -p $HOME/.sbt && ln -s $HOME/.sbt /root/.sbt

ADD etc/entrypoint.sh /entrypoint.sh

RUN for f in "/projects" "$HOME/.cache" "$HOME/.ivy2" "$HOME/.sbt"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
