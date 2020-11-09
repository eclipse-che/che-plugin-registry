# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM mcr.microsoft.com/dotnet/core/sdk:3.1.301-buster

ENV HOME=/home/theia

RUN mkdir /projects ${HOME} && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

RUN mkdir ${HOME}/.dotnet && chmod -R 777 ${HOME}/.dotnet \
    && mkdir /usr/share/dotnet/sdk/NuGetFallbackFolder && chmod 777 /usr/share/dotnet/sdk/NuGetFallbackFolder \
    && mkdir ${HOME}/.nuget && chmod -R 777 ${HOME}/.nuget \
    && mkdir ${HOME}/.templateengine && chmod -R 777 ${HOME}/.templateengine \
    && chmod -R 777 ${HOME}

WORKDIR /projects

ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
