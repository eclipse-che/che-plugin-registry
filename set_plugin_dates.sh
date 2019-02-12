#!/bin/bash
#
# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
set -e

is_first_publication_date_present() {
  # check that first publication date is present in yaml,
  # and is not an null or empty value
  VALUE=$(yq r meta.yaml firstPublicationDate)
  if [[ $VALUE == "null" || $VALUE = "\'\'" ]];then
    return 1
  fi
  return 0;
}

cd plugins
for d in */ ; do
  cd "$d"

  for VERSION_DIR_NAME in */ ; do
    # Remove trailing slash
    VERSION_DIR_NAME=${VERSION_DIR_NAME%/}
    cd "${VERSION_DIR_NAME}"

    DATE=$(date -I)
    if ! is_first_publication_date_present; then
      yq w meta.yaml firstPublicationDate "${DATE}" -i
    fi

    yq w meta.yaml latestUpdateDate "${DATE}" -i
    cd ..
  done

  cd ..
done
