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
ENV VALE_VERSION=2.4.0

RUN mkdir /projects ${HOME} && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done && \
    wget -qO- https://github.com/errata-ai/vale/releases/download/v${VALE_VERSION}/vale_${VALE_VERSION}_Linux_64-bit.tar.gz | tar xvz -C /usr/local/bin && \
    chmod +x /usr/local/bin/vale && \
    apk --no-cache --update --allow-untrusted add asciidoctor && \
    # Future word lists or config files can go here
    mkdir ${HOME}/vale

ADD etc/entrypoint.sh entrypoint.sh

# Default vale.ini is needed
ADD etc/vale.ini ${HOME}

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
