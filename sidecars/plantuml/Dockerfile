# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
FROM plantuml/plantuml-server

ENV TMPDIR=/tmp
ENV HOME=/home/theia

USER root

RUN mkdir /projects && mkdir -p /home/theia && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done && \
    chgrp -R 0 /run && chmod -R g+rwX /run && \
    chgrp -R 0 /var/lib/jetty && chmod -R g+rwX /var/lib/jetty && \
    apt update && apt install -y graphviz

ADD etc/entrypoint.sh /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]

CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
