#!/bin/bash
#
# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# pull all external references to icons, vsix files

set -e

# path to where vsix and svg files will be found in the running plugin registry container image
# this will be replaced at runtime via an entrypoint.sh script
PLUGIN_REGISTRY_URL="http://0.0.0.0/resources/"

# search in a plugin folder, eg., $1 = v3/
echo "Fetch .svg and .vsix resources ... "
metayamls="$(find "$1" -name "meta.yaml" | sort)"
c=0; for metayaml in ${metayamls}; do let c=c+1; done
i=0; for metayaml in ${metayamls}; do
  let i=i+1
  echo "[$i/$c] Fetch from '${metayaml%/meta.yaml}'"
  # get files into local repo
  for remotefile in $(cat $metayaml | egrep "https://|http://" | egrep "\.svg|\.vsix" | sed -e "s#\(icon: \|  - \)##g"); do
    remotefilepath=${remotefile#*//}; # trim off protocol
    remotefilepath=${remotefilepath%\?*}; # trim off querystring
    remotefiledir=${remotefilepath%/*}; # get the dir into which the file will be downloaded
    # echo "
    # wget ${remotefile} to
    # resources/${remotefiledir} as
    # resources/${remotefilepath}"
    mkdir -p resources/${remotefiledir}
    if [[ ! -f resources/${remotefilepath} ]]; then 
      let i=i+1
      let c=c+1
      echo "  [$i/$c] Fetch '${remotefile}'"
      wget -q -nc -nv "${remotefile}" -O resources/${remotefilepath}
    fi
    # update metayaml file
    sed -e "s#${remotefile}#${PLUGIN_REGISTRY_URL}/${remotefilepath}#g" -i $metayaml 
    # echo ""
  done
done

