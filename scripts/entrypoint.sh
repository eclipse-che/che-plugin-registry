#!/bin/bash -x

# NOTE: this env var may not be declared in the pod, so you must declare it thus:
#   oc set env deployment/plugin-registry CHE_WORKSPACE_PLUGIN__REGISTRY__URL=plugin-registry-che7w.192.168.99.112.nip.io
# once set, this entrypoint will re-run and replace 0.0.0.0 with the correct URL 

# replace 0.0.0.0 with the plugin registry's URL
source $(dirname "$0")/replace_0.0.0.0.sh

# start httpd
if [[ -x /usr/sbin/httpd ]]; then /usr/sbin/httpd -D FOREGROUND
elif [[ -x /usr/bin/run-httpd ]]; then /usr/bin/run-httpd
fi
