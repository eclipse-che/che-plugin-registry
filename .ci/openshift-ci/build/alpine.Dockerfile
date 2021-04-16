#
# Copyright (c) 2018-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#

# Build registry
# FROM docker.io/httpd:2.4.46-alpine
FROM registry.access.redhat.com/ubi8-minimal:8.3-298

ENV SKIP_FORMAT=true
ENV SKIP_LINT=true
ENV SKIP_TEST=true
ENV BUILDER=docker

USER root
ADD . /che-plugin-registry
WORKDIR /che-plugin-registry

# Install build tools
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh && \
    apk add --update nodejs npm && \
    npm install --global yarn

# Build repo
RUN yarn && \
    yarn --cwd tools/build build && \
    eval node tools/build/lib/entrypoint.js --output-folder:"output"

# Configure server
RUN apk add --no-cache bash && \
    # Allow htaccess
    sed -i 's|    AllowOverride None|    AllowOverride All|' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's|Listen 80|Listen 8080|' /usr/local/apache2/conf/httpd.conf && \
    mkdir -p /var/www && ln -s /usr/local/apache2/htdocs /var/www/html && \
    chmod -R g+rwX /usr/local/apache2 && \
    echo "ServerName localhost" >> /usr/local/apache2/conf/httpd.conf && \
    apk add --no-cache coreutils

# Copy artifacts
RUN cp /che-plugin-registry/.ci/openshift-ci/build/entrypoint.sh /usr/bin/ && \
    cp /che-plugin-registry/README.md /usr/local/apache2/htdocs/ && \
    cp /che-plugin-registry/.htaccess  /usr/local/apache2/htdocs/ && \
    cp -r /che-plugin-registry/output/v3 /usr/local/apache2/htdocs/v3 && \
    cp /che-plugin-registry/v3/plugins/.htaccess /usr/local/apache2/htdocs/v3/plugins/ && \
    cp /che-plugin-registry/v3/images/eclipse-che-logo.png /usr/local/apache2/htdocs/v3/images/ && \
    rm -rf /che-plugin-registry

ENTRYPOINT ["/usr/bin/entrypoint.sh"]
CMD ["httpd-foreground"]
