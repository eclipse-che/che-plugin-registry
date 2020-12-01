#!/bin/bash
#
# Copyright (c) 2019-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Utility for automatically generating latest meta.yamls for plugins.
#

set -e
cd /
cd /tools/build
echo "Get Yarn dependencies..."
yarn
echo "Build tooling..."
SKIP_FORMAT=true SKIP_LINT=true SKIP_TEST=true yarn build
echo "Run the module to generate meta files..."
node lib/entrypoint.js --output-folder:/build
