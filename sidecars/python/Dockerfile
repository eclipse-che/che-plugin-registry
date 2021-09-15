# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM python:3.8.6-slim

ENV HOME=/home/theia

RUN apt-get update && \
    apt-get install exuberant-ctags && \
    apt-get install wget -y && \
    wget -O - https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get update && \
    apt-get install nodejs gcc build-essential -y && \
    pip install python-language-server[all] ptvsd jedi ipykernel jupyter && \
    apt-get purge -y --auto-remove gcc build-essential && \
    apt-get clean && apt-get -y autoremove && rm -rf /var/lib/apt/lists/*


SHELL ["/bin/bash", "-c"]
RUN command -v source || (echo "ERROR: Could not find 'source' command. SHELL may not supported. If you are using podman, try again with the '--format docker' flag." && exit 126)

RUN mkdir -p "${HOME}" && cd "${HOME}" && \
    python -m venv .venv && \
    source .venv/bin/activate && \
    pip install -U pylint ipykernel jupyter && \
    python -m ipykernel install --name=.venv && \
    mv "${HOME}"/.venv "${HOME}"/.venv-tmp

RUN mkdir /projects && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

ADD etc/entrypoint.sh /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
