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

## check that icon tags in meta.yaml files points to the .svg images
declare -a arr=(`find . -name "meta.yaml"`)
for i in "${arr[@]}"
do
    ICON=$(yq r $i icon | sed 's/^"\(.*\)"$/\1/')
    # Regex: contains .svg and not contains dots after it (to avoid xxx.svg.jpg hacks)
    if [[ ! $ICON =~ (\.svg)+[^\.]*$ ]]; then
      plugin_id=$(evaluate_plugin_id $i)
      plugin_version=$(yq r "$i" version | sed 's/^"\(.*\)"$/\1/')
      plugin_publisher=$(yq r "$i" publisher | sed 's/^"\(.*\)"$/\1/')
      echo "!!!   Wrong icon type found in '${plugin_id}' of publisher '${plugin_publisher}' with version '${plugin_version}':"
      echo "!!!   '${ICON}' Make sure it is pointing to .svg image."
      FOUND=true
    fi
done

if [[ $FOUND ]];then
  exit 1
fi
