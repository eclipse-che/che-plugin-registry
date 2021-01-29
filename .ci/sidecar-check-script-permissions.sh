#!/bin/bash
#
# Copyright (c) 2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

set -e

# shellcheck disable=SC2207
FILES_CHANGED=($(git diff --name-only -r "$1" "$2" -- "sidecars/*.sh"))
NON_EXECUTABLE_SCRIPTS=()

for file in "${FILES_CHANGED[@]}"
do
    if ! [[ -x "$file" ]]; then
        echo "ERROR: $file is not executable"
        NON_EXECUTABLE_SCRIPTS+=("$file")
    fi
done

# shellcheck disable=SC2199
if [[ "${NON_EXECUTABLE_SCRIPTS[@]}" ]]; then
    exit 1
fi
