#
# Copyright (c) 2018-2024 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#   IBM Corporation - implementation
#

# OpenVSX https://github.com/eclipse/openvsx/pkgs/container/openvsx-server
FROM ghcr.io/eclipse/openvsx-server:v0.16.0 AS openvsx-server

# UBI Builder
# https://registry.access.redhat.com/ubi8/ubi
FROM registry.access.redhat.com/ubi8/ubi:8.10-1184 AS ubi-builder
RUN mkdir -p /mnt/rootfs
# Install httpd and postgresql
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "s390x" ]; then \
        echo "Installing base packages for s390x"; \
        yum install --installroot /mnt/rootfs \
            java-17-openjdk coreutils-single glibc-minimal-langpack glibc-langpack-en langpacks-en glibc-locale-source httpd nc \
            net-tools procps vi curl wget tar gzip jq \
            --releasever 8 --nodocs -y; \
        \
        # Create PostgreSQL directories and user manually \
        mkdir -p /mnt/rootfs/var/lib/pgsql/data && \
        mkdir -p /mnt/rootfs/usr/pgsql-15/bin && \
        echo "postgres:x:26:26:PostgreSQL Server:/var/lib/pgsql:/bin/bash" >> /mnt/rootfs/etc/passwd && \
        echo "postgres:x:26:" >> /mnt/rootfs/etc/group; \
    else \
        echo "Installing PostgreSQL for other architectures"; \
        yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm && \
        yum install --installroot /mnt/rootfs \
            postgresql postgresql-server postgresql-libs \
            java-17-openjdk coreutils-single glibc-minimal-langpack glibc-langpack-en langpacks-en glibc-locale-source httpd nc \
            net-tools procps vi curl wget tar gzip jq \
            --releasever 8 --nodocs -y; \
    fi && \
    yum --installroot /mnt/rootfs clean all && \
    rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

# Copy OpenVSX server files
COPY --from=openvsx-server --chown=0:0 /home/openvsx/server /mnt/rootfs/openvsx-server
# Copy our configuration file for OpenVSX server
COPY ./build/dockerfiles/application.yaml /mnt/rootfs/openvsx-server/config/
# use the final root filesystem as default directory
WORKDIR /mnt/rootfs

# apply permissions to later change these files on httpd and postgres
RUN chmod g+rwx /mnt/rootfs/var/log/httpd && \
    mkdir -p /mnt/rootfs/run/httpd && chmod g+rw /mnt/rootfs/run/httpd && \
    mkdir -p /mnt/rootfs/var/lib/pgsql && chmod g+rw /mnt/rootfs/var/lib/pgsql && \
    mkdir -p /mnt/rootfs/var/run/postgresql

# create user template
RUN cat /mnt/rootfs/etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > /mnt/rootfs/.passwd.template \
 && cat /mnt/rootfs/etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > /mnt/rootfs/.group.template

# change permissions
RUN for f in "/mnt/rootfs/etc/passwd" "/mnt/rootfs/etc/group" "/mnt/rootfs/var/lib/pgsql" "/mnt/rootfs/var/run/postgresql"; do \
      chgrp -R 0 ${f} && chmod -R g+rwX ${f}; \
    done

# Apply httpd config file
RUN sed -i /mnt/rootfs/etc/httpd/conf/httpd.conf \
    -e "s,Listen 80,Listen 8080," \
    -e "s,logs/error_log,/dev/stderr," \
    -e "s,logs/access_log,/dev/stdout," \
    -e "s,AllowOverride None,AllowOverride All," && \
    echo "LimitRequestFieldSize 32768" >> /mnt/rootfs/etc/httpd/conf/httpd.conf && \
    chmod a+rwX /mnt/rootfs/etc/httpd/conf /mnt/rootfs/etc/httpd/conf.d /mnt/rootfs/run/httpd /mnt/rootfs/etc/httpd/logs/

STOPSIGNAL SIGWINCH

RUN mkdir -m 777 /mnt/rootfs/var/www/html/v3
COPY /VERSION /mnt/rootfs/
COPY /build/dockerfiles/*.sh /mnt/rootfs/
COPY /openvsx-sync.json /mnt/rootfs/
RUN chmod 755 /mnt/rootfs/*.sh
COPY /build/dockerfiles/openvsx.conf /mnt/rootfs/etc/httpd/conf.d/
COPY README.md .htaccess /mnt/rootfs/var/www/html/
COPY output/v3 /mnt/rootfs/var/www/html/v3
COPY v3/plugins/ /mnt/rootfs/var/www/html/v3/plugins/
COPY v3/images/*.* /mnt/rootfs/var/www/html/v3/images/
# apply permissions to later change these files (entrypoint update_extension_vsx_references)
RUN chmod g+rwx -R /mnt/rootfs/var/www/html/v3

# Use scratch image and then copy ubi fs
FROM scratch
COPY --from=ubi-builder /mnt/rootfs/ /
# Add UTF-8 for the database
RUN localedef -f UTF-8 -i en_US en_US.UTF-8 && \
    if grep -q "^postgres:" /etc/group; then \
        usermod -a -G apache,root,postgres postgres; \
    else \
        groupadd -r postgres && \
        useradd -r -g postgres postgres && \
        usermod -a -G apache,root postgres; \
    fi

USER postgres
ENV LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8 \
    PGDATA=/var/lib/pgsql/data/database \
    # Use a cached version of the license list and not go over the internet
    # it's needed for openvsx server when vsix is publishing on AirGap environment.
    # Set Xmx to run openvsx server
    JVM_ARGS="-DSPDXParser.OnlyUseLocalLicenses=true -Xmx2048m"

RUN if [ -x /usr/bin/postgresql-setup ]; then \
        /usr/bin/postgresql-setup --initdb && \
        # Add all vsix files to the database
        /import-vsix.sh && \
        # add permissions for anyuserid
        chgrp -R 0 /var/lib/pgsql/data/database && \
        rm -f /var/lib/pgsql/data/database/postmaster.pid && \
        rm -f /var/run/postgresql/.s.PGSQL* && \
        rm -f /tmp/.s.PGSQL* && \
        rm -f /tmp/.lock && \
        chmod -R 777 /tmp/file && \
        chmod -R g+rwX /var/lib/pgsql/data/database && \
        mv /var/lib/pgsql/data/database /var/lib/pgsql/data/old; \
    else \
        echo "PostgreSQL not installed, skipping database initialization"; \
        mkdir -p /var/lib/pgsql/data/old; \
    fi
# append Brew metadata here
ENTRYPOINT ["/entrypoint.sh"]
