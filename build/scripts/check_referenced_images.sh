#!/bin/bash
#
# Copyright (c) 2019-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

# Check with skopeo that images are valid. Image list should be passed through stdin.
set -e

while read -r extenal_image
do  
  echo "Checking that $extenal_image is a valid image";
  skopeo inspect "docker://$extenal_image" >/dev/null;
  echo "... OK";
done
