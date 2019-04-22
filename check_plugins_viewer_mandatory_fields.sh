#!/bin/bash
#
# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
set -e

FIELDS=("title" "category" "icon" "description" "repository" "firstPublicationDate" "latestUpdateDate")
CATEGORIES=("Editor" "Debugger" "Formatter" "Language" "Linter" "Snippet" "Theme" "Other")

# check that field value, given in the parameter, is not null or empty
function check_field() {
  if [[ $1 == "null" || $1 = "" ]];then
    return 1;
  fi
  return 0
}

# validate category value, given in the parameter,
function check_category() {
  # If category is absent, replace is with "Other" and consider it valid
  if [[ $1 == "null" || $1 = "\'\'" ]];then
    yq w meta.yaml category "Other" -i
    return 0;
  fi
  for CATEGORY in "${CATEGORIES[@]}"
  do
    if [[ ${CATEGORY} == "$1" ]];then
      return 0
    fi
  done
  return 1
}


cd plugins
echo "start"
for d in */ ; do
  ID_DIR_NAME=${d%/}
  cd "$d"

  for VERSION_DIR_NAME in */ ; do
    # Remove trailing slash
    VERSION_DIR_NAME=${VERSION_DIR_NAME%/}
    cd "${VERSION_DIR_NAME}"

    echo "Checking plugin '${ID_DIR_NAME}/${VERSION_DIR_NAME}'"

    unset NULL_OR_EMPTY_FIELDS

    for FIELD in "${FIELDS[@]}"
    do
      VALUE=$(yq r meta.yaml "$FIELD")
      if [[ "${FIELD}" == "category" ]];then
        if ! check_category "${VALUE}";then
          echo "!!!   Invalid category in '${ID_DIR_NAME}/${VERSION_DIR_NAME}': $VALUE"
          INVALID_FIELDS=true;
        fi
        continue
      fi

      if ! check_field "${VALUE}";then
        NULL_OR_EMPTY_FIELDS+="$FIELD "
      fi
    done

    if [[ -n "${NULL_OR_EMPTY_FIELDS}" ]];then
      echo "!!!   Null or empty mandatory fields in '${ID_DIR_NAME}/${VERSION_DIR_NAME}': $NULL_OR_EMPTY_FIELDS"
      INVALID_FIELDS=true
    fi

    cd ..
  done

  cd ..
done

if [[ -n "${INVALID_FIELDS}" ]];then
  exit 1
fi

