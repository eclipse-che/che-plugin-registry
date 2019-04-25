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

readarray -d '' arr < <(find plugins -name 'meta.yaml' -print0)
for i in "${arr[@]}"
do
    id=$(yq r "$i" id | sed 's/^"\(.*\)"$/\1/')
    version=$(yq r "$i" version | sed 's/^"\(.*\)"$/\1/')

    expected_path="plugins/${id}/${version}/meta.yaml"
    if [[ "${expected_path}" != "$i" ]];then
      echo "!!! Location mismatch in plugin '${id}:${version}':"
      echo "!!!   Expected location: '${expected_path}'"
      echo "!!!   Actual location: '${i}' "
      FOUND=true
    fi
done

if [[ $FOUND ]];then
  exit 1
fi
