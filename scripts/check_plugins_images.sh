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

source $(dirname "$0")/util.sh

## check that icon tags in meta.yaml files points to the .svg images
readarray -d '' arr < <(find . -name 'meta.yaml' -print0)
for i in "${arr[@]}"
do
    ICON=$(yq .icon "$i" | sed 's/^"\(.*\)"$/\1/')
    # Regex: contains .svg and not contains dots after it (to avoid xxx.svg.jpg hacks)
    if [[ ! $ICON =~ (\.svg)+[^\.]*$ ]]; then
      plugin_id=$(evaluate_plugin_id "$i")
      plugin_version=$(yq .version "$i" | sed 's/^"\(.*\)"$/\1/')
      plugin_publisher=$(yq .publisher "$i" | sed 's/^"\(.*\)"$/\1/')
      echo "!!!   Wrong icon type found in '${plugin_id}' of publisher '${plugin_publisher}' with version '${plugin_version}':"
      echo "!!!   '${ICON}' Make sure it is pointing to .svg image."
      FOUND=true
    fi
done

if [[ $FOUND ]];then
  exit 1
fi
