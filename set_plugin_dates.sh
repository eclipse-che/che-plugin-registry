#!/bin/bash
#
# Copyright (c) 2012-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
cd plugins || exit 1
for d in */ ; do
  cd "$d" || exit 1

  for VERSION_DIR_NAME in */ ; do
    # Remove trailing slash
    VERSION_DIR_NAME=${VERSION_DIR_NAME%/}
    cd "${VERSION_DIR_NAME}" || exit 1

    DATE=$(date -I)
    yq w meta.yaml firstPublicationDate "${DATE}" -i || exit 1
    yq w meta.yaml latestUpdateDate "${DATE}" -i || exit 1
    cd ..
  done

  cd ..
done
