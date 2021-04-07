# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM jdkato/vale:v2.10.2 as vale

FROM alpine:3.12.1

ENV HOME=/home/theia

COPY --from=vale /bin/vale /usr/local/bin

RUN mkdir /projects ${HOME} && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done && \
    apk --no-cache --update --allow-untrusted add asciidoctor && \
    # Future word lists or config files can go here
    mkdir ${HOME}/vale

ADD etc/entrypoint.sh entrypoint.sh

# Default _vale.ini is needed
ADD etc/_vale.ini ${HOME}

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
