#!/bin/bash
#
# Copyright (c) 2012-2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e

source ./util.sh

declare -a arr=(`find plugins -name "meta.yaml"`)
for i in "${arr[@]}"
do
    id=$(yq r "$i" id | sed 's/^"\(.*\)"$/\1/')
    version=$(yq r "$i" version | sed 's/^"\(.*\)"$/\1/')

    expected_path="v2/plugins/${id}/${version}/meta.yaml"

    if [ ! -f "${expected_path}" ]; then
      echo "!!! Plugin '${id}:${version}' is not found in '${expected_path}'"
      echo "!!!   V1 and V2 plugins must be in sync"
      echo "!!!   Plugin location: '${i}' "
      FOUND=true
    fi
done

if [[ $FOUND ]];then
  exit 1
fi
