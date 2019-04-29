#!/bin/bash
#
# Copyright (c) 2012-2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Generated plugins index in JSON format.
# Arguments:
# 1 - plugin root folder, e.g. 'v3'

set -e

source ./util.sh

# Returns generated plugin ID.
# Arguments:
# 1 - meta.yaml location
function getId() {
    evaluate_plugin_id $1
}

# getId function MUST be defined to use this function
# Arguments:
# 1 - folder to search files in
function buildIndex() {
    fields=('displayName' 'version' 'type' 'name' 'description' 'publisher')
    ## search for all editors and plugins
    declare -a arr=(`find "$1" -name "meta.yaml"`)
    FIRST_LINE=true
    echo "["
    ## now loop through meta files
    for i in "${arr[@]}"
    do
        if [ "$FIRST_LINE" = true ] ; then
            echo "{"
            FIRST_LINE=false
        else
            echo ",{"
        fi

        plugin_id=$(getId $i)
        echo "  \"id\": \"$plugin_id\","

        for field in ${fields[@]}
        do
            echo "  \"$field\":\""$(yq r "$i" "$field" | sed 's/^"\(.*\)"$/\1/')"\","
        done

        # Add deprecate section
        migrate_to_field=$(yq r "$i" deprecate.migrateTo | sed 's/^"\(.*\)"$/\1/')
        if [ "${migrate_to_field}" != "null" ]; then
            echo "  \"deprecate\":{"
            echo "     \"migrateTo\":\"${migrate_to_field}\","
            auto_migrate_field=$(yq r "$i" deprecate.autoMigrate)
            if [ "${auto_migrate_field}" = "null" ]; then
                auto_migrate_field=false
            fi
            echo "     \"autoMigrate\":${auto_migrate_field}"
            echo "  },"
        fi

        echo "  \"links\": {\"self\":\"/$(echo $i|sed 's/\/meta.yaml$//g')\" }"
        echo "}"
    done
    echo "]"
}

buildIndex "$1"
