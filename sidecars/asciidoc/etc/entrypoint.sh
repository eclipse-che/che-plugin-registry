#!/bin/sh
#
# Copyright (c) 2018-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

set -e

USER_ID=$(id -u)
GROUP_ID=$(id -g)
export USER_ID
export GROUP_ID

if ! whoami >/dev/null 2>&1; then
    echo "${USER_NAME:-user}:x:${USER_ID}:0:${USER_NAME:-user} user:${HOME}:/bin/sh" >> /etc/passwd
fi

# Grant access to projects volume in case of non root user with sudo rights
if [ "${USER_ID}" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo -n true > /dev/null 2>&1; then
    sudo chown "${USER_ID}:${GROUP_ID}" /projects
fi


echo 'Setting "asciidoc.use_asciidoctorpdf" to true'
mkdir -p "${CHE_PROJECTS_ROOT}"/.theia ;
[ ! -f "${CHE_PROJECTS_ROOT}/.theia/settings.json" ] && echo "{}" > "${CHE_PROJECTS_ROOT}/.theia/settings.json"
jq '. += {"asciidoc.use_asciidoctorpdf":true}' "${CHE_PROJECTS_ROOT}/.theia/settings.json" > /tmp/temp.json && mv /tmp/temp.json "${CHE_PROJECTS_ROOT}/.theia/settings.json"

exec "$@"
