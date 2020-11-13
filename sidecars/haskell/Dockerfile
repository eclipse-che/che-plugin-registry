# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation
#   Esteban Mañaricua

FROM haskell:8.10.2-buster

ENV HOME=/home/theia
ENV STACK_ROOT=${HOME}/.stack
ENV GHC=8.10.2
ENV CABAL_INSTALL=3.2
ENV HLS=0.5.0
ENV HPACK=0.34.2

ARG user=theia
ARG group=theia
ARG uid=1000
ARG gid=1000

ENV PATH ${HOME}/.ghcup/bin:/usr/bin:/usr/sbin:/bin:/local/bin:/usr/local/bin:${HOME}/.cabal/bin:${HOME}/.local/bin:/opt/cabal/${CABAL_INSTALL}/bin:/opt/ghc/${GHC}/bin

ADD etc/stack8102.yaml /stack8102.yaml

RUN groupadd -g ${gid} ${group} && \
    useradd -u ${uid} -g ${group} -s /bin/sh -m ${user} && \
    apt update && apt install -y wget sudo libicu-dev libncurses-dev libgmp-dev zlib1g-dev vim bash && \
    rm -rf /root/.stack && mkdir -p /projects ${HOME}/.stack/global-project ${HOME}/.cabal && \
    cd ${HOME} && \
    cp /stack8102.yaml . && rm -f /stack8102.yaml && \
    wget https://github.com/haskell/haskell-language-server/releases/download/${HLS}/haskell-language-server-Linux-${GHC}.gz && \
    wget https://github.com/haskell/haskell-language-server/releases/download/${HLS}/haskell-language-server-wrapper-Linux.gz && \
    gunzip haskell-language-server-Linux-${GHC} -c > /usr/bin/haskell-language-server && chmod +x /usr/bin/haskell-language-server && \
    gunzip haskell-language-server-wrapper-Linux.gz -c > /usr/bin/haskell-language-server-wrapper && chmod +x /usr/bin/haskell-language-server-wrapper && \
    wget https://github.com/sol/hpack/releases/download/${HPACK}/hpack_linux.gz && gunzip hpack_linux.gz -c > /usr/bin/hpack && chmod +x /usr/bin/hpack && \
    rm -f *.gz && \
    echo "packages: []" > ${HOME}/.stack/global-project/stack.yaml && \
    echo "resolver: ghc-${GHC}" >> ${HOME}/.stack/global-project/stack.yaml && \
    chgrp -R ${gid} ${HOME} && \
    chmod -R g+rwX ${HOME} && \
    chown -R ${user}:${group} ${HOME} 
    
USER theia  

RUN cd ${HOME} && \
    cabal update && stack upgrade && \
    git clone https://github.com/haskell/ghcide.git && cp stack8102.yaml ghcide/ && rm -f stack8102.yaml && cd ghcide && stack install --system-ghc --stack-yaml stack8102.yaml && cd .. && \
    git clone https://github.com/phoityne/ghci-dap.git && git clone https://github.com/phoityne/haskell-dap.git && git clone https://github.com/hspec/hspec && \
    echo "resolver: ghc-${GHC}" > ${HOME}/haskell-dap/stack.yaml && \
    echo "packages: " >> ${HOME}/haskell-dap/stack.yaml && \
    echo "- ." >> ${HOME}/haskell-dap/stack.yaml && \
    echo "resolver: ghc-${GHC}" > ${HOME}/ghci-dap/stack.yaml && \
    echo "packages: " >> ${HOME}/ghci-dap/stack.yaml && \
    echo "- ." >> ${HOME}/ghci-dap/stack.yaml && \
    echo "extra-deps: " >> ${HOME}/ghci-dap/stack.yaml && \
    echo "- ../haskell-dap" >> ${HOME}/ghci-dap/stack.yaml && \
    echo "- ghc-paths-0.1.0.12" >> ${HOME}/ghci-dap/stack.yaml && \
    cd haskell-dap && stack build --system-ghc && stack install --system-ghc && cd .. && \
    cd ghci-dap && stack build --system-ghc && stack install --system-ghc && cd .. && \
    cd hspec && cabal install --lib && cabal install hspec-discover haskell-debug-adapter phoityne-vscode && cd .. && \
    rm -rf haskell-dap ghci-dap hspec ghcide 
    
USER root    

ADD etc/entrypoint.sh /entrypoint.sh
ADD etc/settings.yaml /home/theia/.stack/config.yaml
RUN for f in "/etc/passwd" "/projects" "/opt" "/home/theia"; do \
      echo "Changing permissions on ${f}" && chgrp -R 0 ${f} && \
      chmod -R g+rwX ${f}; \
    done 

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ${PLUGIN_REMOTE_ENDPOINT_EXECUTABLE}
