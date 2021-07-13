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

# Initial settings
FROM registry.access.redhat.com/rhscl/httpd-24-rhel7:2.4-133.1608869526 as builder

ENV SKIP_FORMAT=true
ENV SKIP_LINT=true
ENV SKIP_TEST=true
ENV BUILDER=docker

USER root

ADD . /che-plugin-registry
WORKDIR /che-plugin-registry

# Install build tools
RUN yum update -y && yum upgrade -y &&\
    yum install git -y &&\
    yum install openssh -y &&\
    curl -sL https://rpm.nodesource.com/setup_14.x | bash - &&\
    yum install nodejs -y &&\
    npm install --global yarn

# Build repo
RUN ./build.sh --skip-oci-image --skip-digest-generation

FROM registry.access.redhat.com/rhscl/httpd-24-rhel7:2.4-133.1608869526

USER root

# latest httpd container doesn't include ssl cert, so generate one
RUN chmod +x /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh && \
    /usr/share/container-scripts/httpd/pre-init/40-ssl-certs.sh
RUN yum update -y systemd && yum clean all && rm -rf /var/cache/yum && \
    echo "Installed Packages" && rpm -qa | sort -V && echo "End Of Installed Packages"

# BEGIN these steps might not be required
RUN sed -i /etc/httpd/conf/httpd.conf \
    -e "s,Listen 80,Listen 8080," \
    -e "s,logs/error_log,/dev/stderr," \
    -e "s,logs/access_log,/dev/stdout," \
    -e "s,AllowOverride None,AllowOverride All," && \
    chmod a+rwX /etc/httpd/conf /run/httpd /etc/httpd/logs/
STOPSIGNAL SIGWINCH
# END these steps might not be required

WORKDIR /var/www/html

RUN mkdir -m 777 /var/www/html/v3 && \
    mkdir -m 777 /var/www/html/v3/plugins && \
    mkdir -m 777 /var/www/html/v3/images

COPY --from=builder /che-plugin-registry/build/dockerfiles/rhel.entrypoint.sh /che-plugin-registry/build/dockerfiles/entrypoint.sh /usr/local/bin/

RUN chmod g+rwX /usr/local/bin/entrypoint.sh /usr/local/bin/rhel.entrypoint.sh

COPY --from=builder /che-plugin-registry/README.md /che-plugin-registry/.htaccess /var/www/html/
COPY --from=builder /che-plugin-registry/output/v3 /var/www/html/v3
COPY --from=builder /che-plugin-registry/v3/plugins/.htaccess /var/www/html/v3/plugins/
COPY --from=builder /che-plugin-registry/v3/images/default.png /var/www/html/v3/images/

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/rhel.entrypoint.sh"]

# append Brew metadata here
