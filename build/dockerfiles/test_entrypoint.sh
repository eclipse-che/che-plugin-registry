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

METAS_DIR=`mktemp -d`

function cleanup() {
    rm -rf  "${METAS_DIR}";
}
trap cleanup EXIT

function beforeTest() {
    rm -rf "${METAS_DIR}"/*
    unset CHE_SIDECAR_CONTAINERS_REGISTRY_URL \
          CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION \
          CHE_SIDECAR_CONTAINERS_REGISTRY_TAG

}

function assertFileContains() {
    file=$1
    expected_metayaml=$2
    if [[ $(cat "${file}") == "${expected_metayaml}" ]]; then
        echo "Test passed!"
    else
        echo "Test failed!"
        echo "Result:"
        cat "${file}"
        echo "Expected:"
        echo "${expected_metayaml}"
        exit 1
    fi
}

echo "# ${BASH_SOURCE[0]} Running tests for entrypoint.sh"

#################################################################
echo -e "\n## Should update image registry URL. Simple quote."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
echo -e "\n## Should update image registry URL. Double quote."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
echo -e "\n## Should update image registry URL. Multiline."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_URL='https://fakeregistry.io:5000'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
echo -e "\n## Should update image organization."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION='fakeorg'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
echo -e "\n## Should update image organization. Multiline."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION='fakeorg'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
echo -e "\n## Should update image tag."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_TAG='faketag'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"

#################################################################
echo -e "\n## Should update image tag. Multiline."
beforeTest
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
CHE_SIDECAR_CONTAINERS_REGISTRY_TAG='faketag'
source "${script_dir}/entrypoint.sh"

update_container_image_references

assertFileContains "${METAS_DIR}/meta.yaml" "${expected_metayaml}"
