#
# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# Builder: check meta.yamls and create index.json
FROM alpine:3.10 AS builder
USER 0

ARG LATEST_ONLY=false
ENV LATEST_ONLY=${LATEST_ONLY}
RUN apk add --no-cache py-pip jq bash wget && pip install yq jsonschema

COPY ./scripts/*.sh ./scripts/meta.yaml.schema /build/
COPY /v3 /build/v3
WORKDIR /build/

# if only including the /latest/ plugins, apply this line to remove them from builder 
RUN if [[ ${LATEST_ONLY} == "true" ]]; then \
      rm -fr $(find /build/v3 -name 'meta.yaml' | grep -v "/latest/" | grep -o ".*/"); \
    fi

RUN ./check_plugins_location.sh v3 && \
    ./set_plugin_dates.sh v3 && \
    ./check_plugins_viewer_mandatory_fields.sh v3 && \
    ./ensure_latest_exists.sh && \
    ./index.sh v3 > /build/v3/plugins/index.json && \
    chmod -c -R g+rwX /build

# Build registry, copying meta.yamls and index.json from builder
FROM registry.centos.org/centos/httpd-24-centos7 AS registry
USER 0
COPY README.md .htaccess /var/www/html/
COPY --from=builder /build/v3 /var/www/html/v3
COPY ./scripts/*entrypoint.sh /usr/local/bin/

WORKDIR /var/www/html
ENTRYPOINT ["/usr/local/bin/uid_entrypoint.sh", "/usr/local/bin/entrypoint.sh"]

# Offline build: cache .theia and .vsix files in registry itself and update metas
FROM builder AS offline-builder

RUN ./cache_artifacts.sh v3 && chmod -R g+rwX /build

# Offline registry: copy updated meta.yamls and cached extensions
FROM registry AS offline-registry
USER 0

COPY --from=offline-builder /build/v3 /var/www/html/v3
