#!/bin/bash
#
# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
jq 'def reorder: (if has("repository") then {repository} else null end) + (if has("revision") then {revision} else null end) + (to_entries | from_entries ); walk(if type == "object" then reorder else . end)' /build/vscode-extensions.json | jq '.extensions = (.extensions | sort_by(.repository | ascii_downcase))' > /build/vscode-extensions.json.sorted
currentSha1=$(sha512sum /build/vscode-extensions.json | cut -d " " -f 1)
sortedSha1=$(sha512sum /build/vscode-extensions.json.sorted | cut -d " " -f 1)
if [[ "${currentSha1}" != "${sortedSha1}" ]]; then
      echo "!!! vscode-extensions.json is not sorted. Please keep it sorted"
      diff /build/vscode-extensions.json /build/vscode-extensions.json.sorted
      echo "sorted json:"
      cat /build/vscode-extensions.json.sorted
      ERROR=true
fi

if [[ ${ERROR} ]];then
  exit 1
fi
