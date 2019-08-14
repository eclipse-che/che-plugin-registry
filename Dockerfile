#
# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
FROM alpine:3.10 AS builder
RUN apk add --no-cache py-pip jq bash && pip install yq jsonschema

COPY .htaccess README.md ./scripts/*.sh ./scripts/meta.yaml.schema /build/
COPY /v3 /build/v3
WORKDIR /build/
RUN ./check_plugins_location.sh v3
RUN ./set_plugin_dates.sh v3
RUN ./check_plugins_viewer_mandatory_fields.sh v3
RUN ./ensure_latest_exists.sh
RUN ./index.sh v3 > /build/v3/plugins/index.json

FROM registry.centos.org/centos/httpd-24-centos7
RUN mkdir /var/www/html/plugins
COPY --from=builder /build/ /var/www/html/
USER 0
RUN chmod -R g+rwX /var/www/html/v3/plugins
