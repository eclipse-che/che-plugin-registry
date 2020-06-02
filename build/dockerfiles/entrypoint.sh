#!/bin/bash
#
# Copyright (c) 2018-2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Updates plugin runner images to point a registry defined by environment
# variables
#     CHE_SIDECAR_CONTAINERS_REGISTRY_URL
#     CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION
#     CHE_SIDECAR_CONTAINERS_REGISTRY_TAG
#
# By default, this script will operate on the `/var/www/html/v3` directory.
# This can be overridden by the environment variable $METAS_DIR
#
# Will execute any arguments on completion (`exec $@`)

set -e

REGISTRY=${CHE_SIDECAR_CONTAINERS_REGISTRY_URL}
ORGANIZATION=${CHE_SIDECAR_CONTAINERS_REGISTRY_ORGANIZATION}
TAG=${CHE_SIDECAR_CONTAINERS_REGISTRY_TAG}

DEFAULT_METAS_DIR="/var/www/html/v3"
METAS_DIR="${METAS_DIR:-${DEFAULT_METAS_DIR}}"

# Regex used to break an image reference into groups:
#   \1 - Whitespace and (optional) quotation preceding image reference
#   \2 - Registry portion of image, e.g. (quay.io)/eclipse/che-theia:tag
#   \3 - Organization portion of image, e.g. quay.io/(eclipse)/che-theia:tag
#   \4 - Image name portion of image, e.g. quay.io/eclipse/(che-theia):tag
#   \5 - Optional image digest identifier (empty for tags), e.g. quay.io/eclipse/che-theia(@sha256):digest
#   \6 - Tag of image or digest, e.g. quay.io/eclipse/che-theia:(tag)
#   \7 - Optional quotation following image reference
IMAGE_REGEX='([[:space:]]*"?)([._:a-zA-Z0-9-]*)/([._a-zA-Z0-9-]*)/([._a-zA-Z0-9-]*)(@sha256)?:([._a-zA-Z0-9-]*)("?)'

if [[ ! -z $(env | grep .*plugin_registry_image.*) ]];then
  declare -A imageMap
  ENV_IMAGES=$(env | grep .*plugin_registry_image.*)
  for image in  ${ENV_IMAGES[@]}; do
    tag=$(echo ${image} | sed -e 's;.*registry_image_\(.*\)=.*;\1;' | tr _ = | base32 -d)
    digest=$(echo ${image} | sed -e 's;\(.*\)\(@sha256:\)\([._a-zA-Z0-9-]*\);\2\3;')
    imageToReplace=$(echo ${image} | sed -e 's;.*=\(.*\)\@.*;\1;'):${tag}
    imageMap[${imageToReplace}]=${digest}
  done

  echo "--------------------------Digest map--------------------------"
  for KEY in "${!imageMap[@]}"; do
    echo "Key: $KEY Value: ${imageMap[$KEY]}"
  done
  echo "--------------------------------------------------------------"

  readarray -t metas < <(find "${METAS_DIR}" -name 'meta.yaml')
  for meta in "${metas[@]}"; do
    images=$(cat "${meta}" | grep "image:" | sed -E "s;.*image:[[:space:]]*"?\(.*\)"?[[:space:]]*;\1;" | tr -d '"')
    for image in ${images[@]}; do
      digest=${imageMap[${image}]}
      if [[ ! -z "${digest}" ]]; then
        if [[ ${image} == *"@"* ]]
        then
          imageName=$(echo "${image}" | sed -e "s;\(.*\)@.*;\1;")
          tagOrDigest=$(echo "${image}" | sed -e "s;.*@\(.*\);\1;")
        elif [[ ${image} == *":"* ]]
        then
          imageName=$(echo "${image}" | sed -e "s;\(.*\):.*;\1;")
          tagOrDigest=$(echo "${image}" | sed -e "s;.*:\(.*\);\1;")
        else
          imageName=${image}
        fi

        IMAGE_REGEX="([[:space:]]*\"?)(${imageName})(@sha256)?:?(${tagOrDigest})(\"?)"
        sed -i -E "s|image:${IMAGE_REGEX}|image:\1\2\3${digest}\5|" "$meta"
      fi
    done
  done
fi

# We can't use the `-d` option for readarray because
# registry.centos.org/centos/httpd-24-centos7 ships with Bash 4.2
# The below command will fail if any path contains whitespace
readarray -t metas < <(find "${METAS_DIR}" -name 'meta.yaml')
for meta in "${metas[@]}"; do
  echo "Checking meta $meta"
  # Need to update each field separately in case they are not defined.
  # Defaults don't work because registry and tags may be different.
  if [ -n "$REGISTRY" ]; then
    echo "    Updating image registry to $REGISTRY"
    sed -i -E "s|image:$IMAGE_REGEX|image:\1${REGISTRY}/\3/\4\5:\6\7|" "$meta"
  fi
  if [ -n "$ORGANIZATION" ]; then
    echo "    Updating image organization to $ORGANIZATION"
    sed -i -E "s|image:$IMAGE_REGEX|image:\1\2/${ORGANIZATION}/\4\5:\6\7|" "$meta"
  fi
  if [ -n "$TAG" ]; then
    echo "    Updating image tag to $TAG"
    sed -i -E "s|image:$IMAGE_REGEX|image:\1\2/\3/\4:${TAG}\7|" "$meta"
  fi
done

exec "${@}"
