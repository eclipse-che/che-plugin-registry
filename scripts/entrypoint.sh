#!/bin/bash

# fetch resources from the internet into the container
# generate the index.json files
pushd /var/www/html/ 2>/dev/null
popd 2>/dev/null

# TODO: test if this works, or else use env var CHE_WORKSPACE_PLUGIN__REGISTRY__URL
CHE_WORKSPACE_PLUGIN__REGISTRY__URL=$(oc get route plugin-registry  -o yaml | egrep "targetPort|host" | grep -v "host.generated" | \
  sed -e "s#  ##g" | sort | uniq | tr -d "\n" | sed -e "s#host: #https://#" -e "s#targetPort: #:#")
sed -i -e "s#http://0.0.0.0/#${CHE_WORKSPACE_PLUGIN__REGISTRY__URL}#g" /var/www/html/v3/plugins/index.json

# start the server
# /var/www/html/httpd.sh
/usr/bin/run-httpd

