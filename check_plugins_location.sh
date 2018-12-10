#!/bin/bash
#
# Copyright (c) 2012-2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

## browse all plugin directories which names goes as follow
##  <plugin id>/<plugin version>
## and check that directory names match with id/version in meta.yaml files
cd plugins
for d in */ ; do
  ID_DIR_NAME=${d%/}
  cd $d

  for VERSION_DIR_NAME in */ ; do
    # Remove trailing slash
    VERSION_DIR_NAME=${VERSION_DIR_NAME%/}
    cd $VERSION_DIR_NAME

    ID_YAML=$(yq r meta.yaml id | sed 's/^"\(.*\)"$/\1/')
    if [[ "$ID_YAML" != "$ID_DIR_NAME" ]];then
      echo "!!! ID mismatch in plugin '${ID_DIR_NAME}/${VERSION_DIR_NAME}':"
      echo "!!!   id in meta.yaml: '${ID_YAML}'"
      echo "!!!   id directory name: '${ID_DIR_NAME}' "
      FOUND=true
    fi

    VERSION_YAML=$(yq r meta.yaml version | sed 's/^"\(.*\)"$/\1/')
    if [[ "$VERSION_YAML" != "$VERSION_DIR_NAME" ]];then
      echo "!!! Version mismatch in plugin '${ID_DIR_NAME}/${VERSION_DIR_NAME}':"
      echo "!!!   version in meta.yaml: '${VERSION_YAML}'"
      echo "!!!   version directory name: '${VERSION_DIR_NAME}' "
      FOUND=true
    fi

    cd ..
  done

  cd ..
done

if [[ $FOUND ]];then
  exit 1
fi
