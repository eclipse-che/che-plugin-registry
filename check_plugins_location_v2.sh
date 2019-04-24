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

declare -a arr=(`find v2 -name "meta.yaml"`)
for i in "${arr[@]}"
do
    plugin_id=$(evaluate_plugin_id $i)

    expected_path="v2/plugins/${plugin_id}/meta.yaml"
    if [[ "${expected_path}" != "$i" ]]; then
      echo "!!! Location mismatch in plugin '${plugin_id}':"
      echo "!!!   Expected location: '${expected_path}'"
      echo "!!!   Actual location: '${i}' "
      FOUND=true
    fi
done

if [[ $FOUND ]];then
  exit 1
fi
