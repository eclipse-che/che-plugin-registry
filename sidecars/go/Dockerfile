# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM docker.io/golang:1.17.2-stretch

ENV HOME=/home/theia

RUN mkdir /projects ${HOME} && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" "/etc/passwd" "/projects"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done

RUN set -e -x && \
    go get -u -v github.com/ramya-rao-a/go-outline && \
    go get -u -v github.com/acroca/go-symbols &&  \
    go get -u -v golang.org/x/tools/cmd/godoc && \
    go get -u -v github.com/zmb3/gogetdoc && \
    go get -u -v golang.org/x/lint/golint && \
    go get -u -v github.com/fatih/gomodifytags &&  \
    go get -u -v golang.org/x/tools/cmd/gorename && \
    go get -u -v  github.com/sqs/goreturns && \
    go get -u -v golang.org/x/tools/cmd/goimports && \
    go get -u -v github.com/cweill/gotests/... && \
    go get -u -v golang.org/x/tools/cmd/guru && \
    go get -u -v github.com/josharian/impl && \
    go get -u -v github.com/haya14busa/goplay/cmd/goplay && \
    go get -u -v github.com/davidrjenni/reftools/cmd/fillstruct && \
    go get -u -v github.com/go-delve/delve/cmd/dlv && \
    go get -u -v github.com/rogpeppe/godef && \
    go get -u -v github.com/uudashr/gopkgs/v2/cmd/gopkgs && \
    go get -u -v golang.org/x/tools/cmd/gotype && \
    go get -u -v github.com/mdempsky/gocode && \
    go get -v golang.org/x/tools/gopls@master golang.org/x/tools@master && \
    go get -v honnef.co/go/tools/cmd/staticcheck@master && \
    chmod -R 777 /go && \
    mkdir -p /.cache && chmod -R 777 /.cache && \
    mkdir -p /usr/local/go && chmod -R 777 /usr/local/go && \
    cd /usr/local/go && wget -O- -nv https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s v1.41.1

ENV GOPATH /go
ENV GOCACHE /.cache
ENV GOROOT /usr/local/go

ADD etc/entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
