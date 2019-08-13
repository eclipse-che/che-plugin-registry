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

# accepts meta.yaml path as first argument, and field to check as second argument
is_field_present() {
  FIELD="$2"
  # check that first publication date is present in yaml,
  # and is not an null or empty value
  if ! VALUE=$(yq ${FIELD} "$1" | tr -d "\""); then # trim quotes from the field value
    exit 1
  fi

  if [[ $VALUE == "null" || $VALUE = "\'\'" || $2 = "\"\"" ]];then
    return 1
  fi
  return 0;
}

readarray -d '' arr < <(find . -name 'meta.yaml' -print0)
for i in "${arr[@]}"
do
    DATE=$(date -I)
    if [[ "$(egrep "^firstPublicationDate:" ${i})" == "" ]]; then 
      echo >> ${i}; echo "firstPublicationDate: '$DATE'" >> ${i}
    fi
    if [[ $(egrep "^latestUpdateDate:" ${i}) == "" ]]; then 
      echo >> ${i}; echo "latestUpdateDate: '$DATE'" >> ${i}
    else
      sed -i -e "s#^latestUpdateDate: .\+#latestUpdateDate: '${DATE}'#g" "${i}"
    fi
done
