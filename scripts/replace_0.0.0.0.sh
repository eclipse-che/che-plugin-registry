#!/bin/bash

# NOTE: this env var may not be declared in the pod, so you must declare it thus:
#   oc set env deployment/plugin-registry CHE_WORKSPACE_PLUGIN__REGISTRY__URL=plugin-registry-che7w.192.168.99.112.nip.io
# once set, this entrypoint will re-run and replace 0.0.0.0 with the correct URL 

# if CHE_WORKSPACE_PLUGIN__REGISTRY__URL is defined, replace URLs in meta.yaml and index.json containing 0.0.0.0 with that route URL
urlvar=CHE_WORKSPACE_PLUGIN__REGISTRY__URL
if [[ ${!urlvar} ]]; then 
    echo "${urlvar} = ${!urlvar}"
    for d in $(find /var/www/html/ -name meta.yaml -o -name index.json); do 
        sed -i -e "s#0.0.0.0#${!urlvar}#g" $d
        # for debugging only
        # echo $d; egrep "//0\.0\.0\.0|//${!urlvar}" $d; 
    done
fi
