#!/bin/sh
#
# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

m2="$HOME/.m2"
settingsXML="$m2/settings.xml"

set_maven_mirror() {
    [ ! -d "$m2" ] && mkdir -p "$m2"

    if [ ! -f "$settingsXML" ]; then
        {
            echo "<settings xmlns=\"http://maven.apache.org/SETTINGS/1.0.0\""
            echo "  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
            echo "  xsi:schemaLocation=\"http://maven.apache.org/SETTINGS/1.0.0"
            echo "                      https://maven.apache.org/xsd/settings-1.0.0.xsd\">"
            echo "  <mirrors>"
            echo "    <mirror>"
            echo "      <url>\${env.MAVEN_MIRROR_URL}</url>"
            echo "      <mirrorOf>external:*</mirrorOf>"
            echo "    </mirror>"
            echo "  </mirrors>"
            echo "</settings>"
        } >> "$settingsXML"
    else
        if ! grep -q "<url>\${env.MAVEN_MIRROR_URL}</url>" "$settingsXML"; then
            if grep -q "<mirrors>" "$settingsXML"; then
                # shellcheck disable=SC2154
                sed -i "s/<mirrors>/<mirrors>\n    <mirror>\n      <url>${env.MAVEN_MIRROR_URL}<\/url>\n      <mirrorOf>external:\*<\/mirrorOf>\n    <\/mirror>/" "$settingsXML"
            else
                # shellcheck disable=SC2154
                sed -i "s/<\/settings>/  <mirrors>\n    <mirror>\n      <url>${env.MAVEN_MIRROR_URL}<\/url>\n      <mirrorOf>external:*<\/mirrorOf>\n    <\/mirror>\n  <\/mirrors>\n<\/settings>/" "$settingsXML"
            fi
        fi
    fi
}

[ -n "$MAVEN_MIRROR_URL" ] && set_maven_mirror
return 0
