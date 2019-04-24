#!/bin/bash
#
# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Prints plugin/editor full ID to STDOUT in format 'publisher_id/plugin_id/version'.
# Supports old and new notation.
# Arguments:
#   1 - path to meta.yaml
function evaluate_plugin_id() {
    name_field=$(yq r "$1" name | sed 's/^"\(.*\)"$/\1/')
    version_field=$(yq r "$1" version | sed 's/^"\(.*\)"$/\1/')
    publisher_field=$(yq r "$1" publisher | sed 's/^"\(.*\)"$/\1/')
    full_id=""
    if [ ! -z "${publisher_field}" ]; then
        full_id+="${publisher_field}/"
    fi
    full_id+="${name_field}/${version_field}"
    echo "${full_id}"
}

# Prints plugin/editor publisher to STDOUT.
# Arguments:
#   1 - path to meta.yaml
function evaluate_plugin_publisher() {
    publisher_field=$(yq r "$1" publisher | sed 's/^"\(.*\)"$/\1/')
    echo "${publisher_field}"
}

# Prints plugin/editor name to STDOUT.
# Arguments:
#   1 - path to meta.yaml
function evaluate_plugin_name() {
    name_field=$(yq r "$1" name | sed 's/^"\(.*\)"$/\1/')
    echo "${name_field}"
}
