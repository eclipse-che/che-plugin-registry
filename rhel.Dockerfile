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
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/ubi8-minimal
FROM registry.access.redhat.com/ubi8-minimal:8.0-213 as builder
USER 0

################# 
# PHASE ONE: create ubi8-minimal image with yq
################# 

# to get all the python deps pre-fetched so we can build in Brew:
# 1. extract files in the container to your local filesystem
#    CONTAINERNAME="pluginregistry"
#    mkdir -p /tmp/root-local/ && docker run -it -v /tmp/root-local/:/tmp/root-local/ ${CONTAINERNAME} /bin/bash -c "cd /root/.local/ && cp -r bin/ lib/ /tmp/root-local/"
# 2. then back on your own machine, tar them up and put them in this folder
#    cd /tmp/root-local && sudo tar cvzf root-local.tgz lib/ bin/ && cd - && mv -f /tmp/root-local/root-local.tgz . && sudo rm -fr /tmp/root-local/
# 3. then add it to dist-git so it's part of this repo
#    rhpkg new-sources root-local.tgz 

# built in Brew, use tarball in lookaside cache
# COPY root-local.tgz /tmp/root-local.tgz

# NOTE: uncomment for local build. Must also set full registry path in FROM to registry.redhat.io or registry.access.redhat.com
# enable rhel 7 or 8 content sets (from Brew) to resolve jq as rpm
COPY content_sets_epel7.repo /etc/yum.repos.d/

RUN microdnf install -y findutils bash wget yum gzip tar jq python3-six python3-pip && microdnf -y clean all && \
    # install yq (depends on jq and pyyaml - if jq and pyyaml not already installed, this will try to compile it)
    if [[ -f /tmp/root-local.tgz ]]; then mkdir -p /root/.local && tar xf /tmp/root-local.tgz -C /root/.local/ && rm -fr /tmp/root-local.tgz; fi && \
    /usr/bin/pip3.6 install --user yq jsonschema && \
    # could be installed in /opt/app-root/src/.local/bin or /root/.local/bin
    for d in /opt/app-root/src/.local /root/.local; do \
      if [[ -d ${d} ]]; then \
        cp ${d}/bin/yq ${d}/bin/jsonschema /usr/local/bin/; \
        pushd ${d}/lib/python3.6/site-packages/ >/dev/null; \
          cp -r PyYAML* xmltodict* yaml* yq* jsonschema* /usr/lib/python3.6/site-packages/; \
        popd >/dev/null; \
      fi; \
    done && \
    chmod +x /usr/local/bin/yq && \
    ln -s /usr/bin/python3.6 /usr/bin/python

# for debugging only
# RUN microdnf install -y util-linux && whereis python pip jq yq && python --version && jq --version && yq --version

################# 
# PHASE TWO: configure registry image
#################

# if only including the /latest/ plugins, apply this line to remove them from builder 
# RUN rm -fr $(find /build/v3 -name 'meta.yaml' | grep -v "/latest/")

COPY ./scripts/*.sh ./scripts/meta.yaml.schema /build/
COPY /v3 /build/v3
WORKDIR /build/
RUN ./check_plugins_location.sh v3 && \
    ./set_plugin_dates.sh v3 && \
    ./check_plugins_viewer_mandatory_fields.sh v3 && \
    ./ensure_latest_exists.sh && \
    ./index.sh v3 > /build/v3/plugins/index.json && \
    chmod -c -R g+rwX /build

################# 
# PHASE THREE: create ubi8-minimal image with httpd
################# 

ENV SUMMARY="Red Hat CodeReady Workspaces plugin registry container" \
    DESCRIPTION="Red Hat CodeReady Workspaces plugin registry container" \
    PRODNAME="codeready-workspaces" \
    COMPNAME="pluginregistry-rhel8"

LABEL summary="$SUMMARY" \
      description="$DESCRIPTION" \
      io.k8s.description="$DESCRIPTION" \
      io.k8s.display-name="$DESCRIPTION" \
      io.openshift.tags="$PRODNAME,$COMPNAME" \
      com.redhat.component="$PRODNAME-$COMPNAME-container" \
      name="$PRODNAME/$COMPNAME" \
      version="2.0" \
      license="EPLv2" \
      maintainer="Nick Boldt <nboldt@redhat.com>" \
      io.openshift.expose-services="" \
      usage=""

USER root

# Build registry, copying meta.yamls and index.json from builder
# https://access.redhat.com/containers/?tab=tags#/registry.access.redhat.com/rhscl/httpd-24-rhel7
FROM registry.access.redhat.com/rhscl/httpd-24-rhel7:2.4-104 AS registry

# BEGIN these steps might not be required
USER 0
RUN sed -i /etc/httpd/conf/httpd.conf \
    -e "s,Listen 80,Listen 8080," \
    -e "s,logs/error_log,/dev/stderr," \
    -e "s,logs/access_log,/dev/stdout," \
    -e "s,AllowOverride None,AllowOverride All," && \
    chmod a+rwX /etc/httpd/conf /run/httpd
EXPOSE 80
STOPSIGNAL SIGWINCH
ENTRYPOINT ["/usr/sbin/httpd", "-D", "FOREGROUND"]
# END these steps might not be required

COPY README.md .htaccess /var/www/html/
COPY --from=builder /build/v3 /var/www/html/v3

# Offline build: cache .theia and .vsix files in registry itself and update metas
FROM builder AS offline-builder

# To only cache files from /latest/ folders, use ./cache_artifacts.sh v3 --latest-only 
# and uncomment line above to remove files so they're not included in index.json -- RUN rm -fr $(find /build/v3 -name 'meta.yaml' | grep -v "/latest/")
RUN ./cache_artifacts.sh v3 && chmod -R g+rwX /build

# Offline registry: copy updated meta.yamls and cached extensions
FROM registry AS offline-registry
COPY --from=offline-builder /build/v3 /var/www/html/v3
WORKDIR /var/www/html
