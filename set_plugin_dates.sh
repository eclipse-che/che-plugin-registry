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

# accepts meta.yaml path as one and only argument
is_first_publication_date_present() {
  # check that first publication date is present in yaml,
  # and is not an null or empty value
  if ! VALUE=$(yq r "$1" firstPublicationDate); then
    exit 1
  fi

  if [[ $VALUE == "null" || $VALUE = "\'\'" ]];then
    return 1
  fi
  return 0;
}

readarray -d '' arr < <(find . -name 'meta.yaml' -print0)
for i in "${arr[@]}"
do
    DATE=$(date -I)

    if ! is_first_publication_date_present "$i"; then
      yq w "$i" firstPublicationDate "${DATE}" -i
    fi

    yq w "$i" latestUpdateDate "${DATE}" -i
done
