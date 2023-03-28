#!/bin/bash
#
# Copyright (c) 2018-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

METAS_DIR=$(mktemp -d)

function cleanup() {
    rm -rf  "${METAS_DIR}";
}
trap cleanup EXIT

RED="\e[31m"
GREEN="\e[32m"
RESETSTYLE="\e[0m"
BOLD="\e[1m"
DEFAULT_EMOJI_HEADER="🏃" # could be overiden with EMOJI_HEADER="-"
EMOJI_HEADER=${EMOJI_HEADER:-$DEFAULT_EMOJI_HEADER}
DEFAULT_EMOJI_PASS="✔" # could be overriden with EMOJI_PASS="[PASS]"
EMOJI_PASS=${EMOJI_PASS:-$DEFAULT_EMOJI_PASS}
DEFAULT_EMOJI_FAIL="✘" # could be overriden with EMOJI_FAIL="[FAIL]"
EMOJI_FAIL=${EMOJI_FAIL:-$DEFAULT_EMOJI_FAIL}

function initTest() {
    echo -e "${BOLD}\n${EMOJI_HEADER} ${1}${RESETSTYLE}"
    rm -rf "${METAS_DIR:?}"/*
    unset CHE_SIDECAR_CONTAINERS_REGISTRY_URL \
          CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION \
          CHE_SIDECAR_CONTAINERS_REGISTRY_TAG \
          RELATED_IMAGE_codeready_workspaces_theia_endpoint_plugin_registry_image_GIXDCMIK \
          RELATED_IMAGE_codeready_workspaces_machineexec_plugin_registry_image_GIXDCMIK \
          RELATED_IMAGE_codeready_workspaces_theia_plugin_registry_image_GIXDCMIK

}

function assertFileContentEquals() {
    file=$1
    expected_metayaml=$2

    if [[ $(cat "${file}") == "${expected_metayaml}" ]]; then
        echo -e "${GREEN}${EMOJI_PASS}${RESETSTYLE} Test passed!"
    else
        echo -e "${RED}${EMOJI_FAIL}${RESETSTYLE} Test failed!"
        echo "Result:"
        cat "${file}"
        echo "Expected:"
        echo "${expected_metayaml}"
        exit 1
    fi
}
echo -e "${BOLD}\n${EMOJI_HEADER}${EMOJI_HEADER}${EMOJI_HEADER} Running tests for entrypoint.sh: ${BASH_SOURCE[0]}${RESETSTYLE}"


#################################################################
initTest "Should update image registry URL. Simple quote."

metayaml=$(cat <<-END
spec:
  containers:
    - image: 'quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d'
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: 'https://fakeregistry.io:5000/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d'
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should update image registry URL with CHE_SIDECAR_CONTAINERS_REGISTRY_URL. Double quote."

metayaml=$(cat <<-END
spec:
  containers:
    - image: "quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d"
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: "https://fakeregistry.io:5000/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d"
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should update image registry URL with CHE_SIDECAR_CONTAINERS_REGISTRY_URL. Multiline."

metayaml=$(cat <<-END
spec:
  containers:
    - image: >-
        quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: >-
        https://fakeregistry.io:5000/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should update image registry URL with CHE_SIDECAR_CONTAINERS_REGISTRY_URL. Multiple occurences."

metayaml=$(cat <<-END
spec:
 containers:
    - image: 'quay.io/eclipse/che-theia@sha256:69b7d27a9e9a4b46c2734d995456385bb0d7ab1022638d95ddaa5a5919ef43c1'
      env:
        - name: THEIA_PLUGINS
          value: 'local-dir:///plugins'
        - name: HOSTED_PLUGIN_HOSTNAME
          value: 0.0.0.0
        - name: HOSTED_PLUGIN_PORT
          value: '3130'
        - name: THEIA_HOST
          value: 127.0.0.1
      mountSources: true
      memoryLimit: 512M
      volumes:
        - name: plugins
          mountPath: /plugins
        - name: theia-local
          mountPath: /home/theia/.theia
      name: theia-ide
      ports:
        - exposedPort: 3100
        - exposedPort: 3130
        - exposedPort: 13131
        - exposedPort: 13132
        - exposedPort: 13133
    - image: 'quay.io/eclipse/che-machine-exec@sha256:98fdc3f341ed683dc0f07176729c887f2b965bade9c27d16dc0e05f9034e624c'
      command:
        - /go/bin/che-machine-exec
        - '--url'
        - '127.0.0.1:3333'
END
)
expected_metayaml=$(cat <<-END
spec:
 containers:
    - image: 'https://fakeregistry.io:5000/eclipse/che-theia@sha256:69b7d27a9e9a4b46c2734d995456385bb0d7ab1022638d95ddaa5a5919ef43c1'
      env:
        - name: THEIA_PLUGINS
          value: 'local-dir:///plugins'
        - name: HOSTED_PLUGIN_HOSTNAME
          value: 0.0.0.0
        - name: HOSTED_PLUGIN_PORT
          value: '3130'
        - name: THEIA_HOST
          value: 127.0.0.1
      mountSources: true
      memoryLimit: 512M
      volumes:
        - name: plugins
          mountPath: /plugins
        - name: theia-local
          mountPath: /home/theia/.theia
      name: theia-ide
      ports:
        - exposedPort: 3100
        - exposedPort: 3130
        - exposedPort: 13131
        - exposedPort: 13132
        - exposedPort: 13133
    - image: 'https://fakeregistry.io:5000/eclipse/che-machine-exec@sha256:98fdc3f341ed683dc0f07176729c887f2b965bade9c27d16dc0e05f9034e624c'
      command:
        - /go/bin/che-machine-exec
        - '--url'
        - '127.0.0.1:3333'
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
initTest "Should update image organization with CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION."
metayaml=$(cat <<-END
spec:
  containers:
    - image: 'quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d'
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: 'quay.io/fakeorg/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d'
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION='fakeorg'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should update image organization with CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION. Multiline."

metayaml=$(cat <<-END
spec:
  containers:
    - image: >-
        quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: >-
        quay.io/fakeorg/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION='fakeorg'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should update image tag with CHE_SIDECAR_CONTAINERS_REGISTRY_TAG."

metayaml=$(cat <<-END
spec:
  containers:
    - image: 'quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d'
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: 'quay.io/eclipse/che-plugin-sidecar:faketag'
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_TAG='faketag'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should update image tag with CHE_SIDECAR_CONTAINERS_REGISTRY_TAG. Multiline."

metayaml=$(cat <<-END
spec:
  containers:
    - image: >-
        quay.io/eclipse/che-plugin-sidecar@sha256:d565b98f110efe4246fe1f25ee62d74d70f4f999e4679e8f7085f18b1711f76d
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: >-
        quay.io/eclipse/che-plugin-sidecar:faketag
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_TAG='faketag'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"


#################################################################
initTest "Should do nothing."

metayaml=$(cat <<-END
spec:
  containers:
    - image: 'name'
      name: asciidoctor-vscode
END
)
expected_metayaml=$(cat <<-END
spec:
  containers:
    - image: 'name'
      name: asciidoctor-vscode
END
)
echo "$metayaml" > "${METAS_DIR}/meta.yaml"
export CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContentEquals "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
initTest "Should replace image references in che-code devfile.yaml with RELATED_IMAGE env vars "

devfileyaml=$(cat <<-END
schemaVersion: 2.1.0
metadata:
  name: che-code
commands:
  - id: init-container-command
    apply:
      component: che-code-injector
  - id: init-che-code-command
    exec:
      component: che-code-runtime-description
      commandLine: nohup /checode/entrypoint-volume.sh > /checode/entrypoint-logs.txt 2>&1 &
events:
  preStart:
    - init-container-command
  postStart:
    - init-che-code-command
components:
  - name: che-code-runtime-description
    container:
      image: quay.io/devfile/universal-developer-image:2.11
      volumeMounts:
        - name: checode
          path: /checode
      memoryLimit: 1024Mi
      memoryRequest: 256Mi
      cpuLimit: 500m
      cpuRequest: 30m
      endpoints:
        - name: che-code
          attributes:
            type: main
            cookiesAuthEnabled: true
            discoverable: false
            urlRewriteSupported: true
          targetPort: 3100
          exposure: public
          secure: false
          protocol: https
        - name: code-redirect-1
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13131
          exposure: public
          protocol: http
        - name: code-redirect-2
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13132
          exposure: public
          protocol: http
        - name: code-redirect-3
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13133
          exposure: public
          protocol: http
    attributes:
      app.kubernetes.io/component: che-code-runtime
      app.kubernetes.io/part-of: che-code.eclipse.org
      controller.devfile.io/container-contribution: true
  - name: checode
    volume: {}
  - name: che-code-injector
    container:
      image: quay.io/che-incubator/che-code:2.11
      command:
        - /entrypoint-init-container.sh
      volumeMounts:
        - name: checode
          path: /checode
      memoryLimit: 256Mi
      memoryRequest: 32Mi
      cpuLimit: 500m
      cpuRequest: 30m
END
)
expected_devfileyaml=$(cat <<-END
schemaVersion: 2.1.0
metadata:
  name: che-code
commands:
  - id: init-container-command
    apply:
      component: che-code-injector
  - id: init-che-code-command
    exec:
      component: che-code-runtime-description
      commandLine: nohup /checode/entrypoint-volume.sh > /checode/entrypoint-logs.txt 2>&1 &
events:
  preStart:
    - init-container-command
  postStart:
    - init-che-code-command
components:
  - name: che-code-runtime-description
    container:
      image: quay.io/devfile/universal-developer-image@sha256:80fdd1ae37d3b9e0260d9c66b4ff12e35317c31243eabeea5212d98c537a3ba9
      volumeMounts:
        - name: checode
          path: /checode
      memoryLimit: 1024Mi
      memoryRequest: 256Mi
      cpuLimit: 500m
      cpuRequest: 30m
      endpoints:
        - name: che-code
          attributes:
            type: main
            cookiesAuthEnabled: true
            discoverable: false
            urlRewriteSupported: true
          targetPort: 3100
          exposure: public
          secure: false
          protocol: https
        - name: code-redirect-1
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13131
          exposure: public
          protocol: http
        - name: code-redirect-2
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13132
          exposure: public
          protocol: http
        - name: code-redirect-3
          attributes:
            discoverable: false
            urlRewriteSupported: false
          targetPort: 13133
          exposure: public
          protocol: http
    attributes:
      app.kubernetes.io/component: che-code-runtime
      app.kubernetes.io/part-of: che-code.eclipse.org
      controller.devfile.io/container-contribution: true
  - name: checode
    volume: {}
  - name: che-code-injector
    container:
      image: quay.io/che-incubator/che-code@sha256:8fd9eca7c28c59ce93c0b24c7ff0f38080e9a2ac66668274aeabc6b8f3144012
      command:
        - /entrypoint-init-container.sh
      volumeMounts:
        - name: checode
          path: /checode
      memoryLimit: 256Mi
      memoryRequest: 32Mi
      cpuLimit: 500m
      cpuRequest: 30m
END
)
echo "$devfileyaml" > "${METAS_DIR}/devfile.yaml"
export RELATED_IMAGE_che_code_plugin_registry_image_GIXDCMIK='quay.io/che-incubator/che-code@sha256:8fd9eca7c28c59ce93c0b24c7ff0f38080e9a2ac66668274aeabc6b8f3144012'
export RELATED_IMAGE_universal_developer_image_plugin_registry_image_GIXDCMIK='quay.io/devfile/universal-developer-image@sha256:80fdd1ae37d3b9e0260d9c66b4ff12e35317c31243eabeea5212d98c537a3ba9'

# shellcheck disable=SC1090
source "${script_dir}/entrypoint.sh"

extract_and_use_related_images_env_variables_with_image_digest_info

assertFileContentEquals "${METAS_DIR}/devfile.yaml" "${expected_devfileyaml}"
