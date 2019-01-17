#!/bin/bash
#
# Copyright (c) 2012-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
FIELDS=("title" "publisher" "category" "icon" "description" "repository" "firstPublicationDate" "latestUpdateDate")
CATEGORIES=("Editor" "Debugger" "Formatter" "Language" "Linter" "Snippet" "Theme" "Other")

function check_category() {
for CATEGORY in "${CATEGORIES[@]}"
do
  if [[ ${CATEGORY} == "$1" ]];then
    return 0
  fi
done
return 1
}

cd plugins || exit 1
for d in */ ; do
  ID_DIR_NAME=${d%/}
  cd "$d" || exit 1

  for VERSION_DIR_NAME in */ ; do
    # Remove trailing slash
    VERSION_DIR_NAME=${VERSION_DIR_NAME%/}
    cd "${VERSION_DIR_NAME}" || exit 1

    unset NULL_OR_EMPTY_FIELDS

    for FIELD in "${FIELDS[@]}"
    do
      VALUE=$(yq r meta.yaml "$FIELD")
      if [[ $VALUE == "null" || $VALUE = "\'\'" ]];then
        # All fields are validated for not being null or empty, except for Category field:
        # If the Category field is empty or null, then "Other" category will be set by default
        # If the Category field has value, it should be matching the one from CATEGORIES array,
        # or else it is invalid
        if [[ "${FIELD}" == "category" ]];then
          yq w meta.yaml category "Other" -i
          VALUE=$(yq r meta.yaml "$FIELD")
          if ! check_category "${VALUE}";then
            echo "!!!   Invalid category in '${ID_DIR_NAME}/${VERSION_DIR_NAME}': $VALUE"
            INVALID_FIELDS=true
          fi
          continue
        fi
        NULL_OR_EMPTY_FIELDS+="$FIELD "
        continue
      fi
    done

    if [[ -n "${NULL_OR_EMPTY_FIELDS}" ]];then
      echo "!!!   Null or empty mandatory fields in '${ID_DIR_NAME}/${VERSION_DIR_NAME}': $NULL_OR_EMPTY_FIELDS"
      INVALID_FIELDS=true
    fi

    cd .. || exit 1
  done

  cd .. || exit 1
done

if [[ -n "${INVALID_FIELDS}" ]];then
  exit 1
fi

