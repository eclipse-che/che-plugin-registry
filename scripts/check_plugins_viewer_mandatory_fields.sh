#!/bin/bash
#
# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Checks whether mandatory fields are in place. Also checks value of 'category 'field.

set -e

FIELDS=("title" "publisher" "category" "icon" "description" "repository" "firstPublicationDate" "latestUpdateDate" "spec" "apiVersion")
CATEGORIES=("Editor" "Debugger" "Formatter" "Language" "Linter" "Snippet" "Theme" "Other")

source $(dirname "$0")/util.sh

# check that field value, given in the parameter, is not null or empty
function check_field() {
  if [[ $1 == "null" || $1 = "" ]];then
    return 1;
  fi
  return 0
}

# Validates category value, given in the parameter.
# Arguments:
# 1 - path to meta.yaml
# 2 - value of category field
function check_category() {
  # If category is absent, replace is with "Other" and consider it valid
  if [[ $2 == "null" || $2 = "\'\'" || $2 = "\"\"" ]];then
    echo "category: 'Other'" >> $1
    return 0;
  fi
  for CATEGORY in "${CATEGORIES[@]}"
  do
    if [[ "${CATEGORY}" == "${2//\"/}" ]];then # trim quotes from the field value
      return 0
    fi
  done
  return 1
}

readarray -d '' arr < <(find v3 -name 'meta.yaml' -print0)
for i in "${arr[@]}"
do
    plugin_id=$(evaluate_plugin_id "$i")

    echo "Checking plugin '${plugin_id}'"

    unset NULL_OR_EMPTY_FIELDS

    for FIELD in "${FIELDS[@]}"
    do
      VALUE=$(yq ."${FIELD}" "$i" | tr -d "\"") # trim quotes from the field value
      if [[ "${FIELD}" == "category" ]];then # echo "$i: $FIELD = $VALUE"
        if ! check_category "$i" "${VALUE}";then
          echo "!!!   Invalid category in '${plugin_id}': $VALUE"
          INVALID_FIELDS=true;
          INVALID_FIELDS=true;
        fi
        continue
      fi

      if ! check_field "${VALUE}";then
        NULL_OR_EMPTY_FIELDS+="$FIELD "
      fi
    done

    if [[ -n "${NULL_OR_EMPTY_FIELDS}" ]];then
      echo "!!!   Null or empty mandatory fields in '${plugin_id}': $NULL_OR_EMPTY_FIELDS"
      INVALID_FIELDS=true
    fi
done

if [[ -n "${INVALID_FIELDS}" ]];then
  exit 1
fi
