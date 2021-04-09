#!/bin/bash
#
# Copyright (c) 2018-2021 Red Hat, Inc.
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

# Extract and use env variables with image digest information.
# Env variable name format: 
# RELATED_IMAGES_(Image_name)_(Image_label)_(Encoded_base32_image_tag)
# Where are:
# "Image_name" - image name. Not valid chars for env variable name replaced to '_'.
# "Image_label" - image target, for example 'plugin_registry_image'.
# "Encoded_base32_image_tag_" - original image tag encoded to base32, to avoid invalid for env name chars. base32 alphabet has only 
# one invalid character for env name: '='. That's why it was replaced to '_'. 
# INFO: "=" for base32 it is pad character. If encoded string contains this char(s), then it is always located at the end of the string.
# Env value it is image with digest to use.
# Example env variable:
# RELATED_IMAGE_che_sidecar_clang_plugin_registry_image_HAWTQM3BMRRDGYIK="quay.io/eclipse/che-sidecar-clang@sha256:1c217f34ca69108fdd1ab844c0bcf960edff92519677bde4f8a5f4841b104745"
if env | grep -q ".*plugin_registry_image.*"; then
  declare -A imageMap
  readarray -t ENV_IMAGES < <(env | grep ".*plugin_registry_image.*")
  for imageEnv in "${ENV_IMAGES[@]}"; do
    tagOrDigest=$(echo "${imageEnv}" | sed -e 's;.*registry_image_\(.*\)=.*;\1;' | tr _ = | base32 -d)
    if [[ ${tagOrDigest} == *"@"* ]]; then
      # Well, image was "freezed", because it already has got digest, so do nothing.
      continue
    fi
    imageWithDigest=${imageEnv#*=};
    if [[ -n "${tagOrDigest}" ]]; then
      imageToReplace="${imageWithDigest%@*}:${tagOrDigest}"
    else
      imageToReplace="${imageWithDigest%@*}"
    fi
    digest="@${imageWithDigest#*@}"
    imageMap["${imageToReplace}"]="${digest}"
  done

  echo "--------------------------Digest map--------------------------"
  for KEY in "${!imageMap[@]}"; do
    echo "Key: $KEY Value: ${imageMap[${KEY}]}"
  done
  echo "--------------------------------------------------------------"

  readarray -t metas < <(find "${METAS_DIR}" -name 'meta.yaml')
  for meta in "${metas[@]}"; do
    readarray -t images < <(grep "image:" "${meta}" | sed -r "s;.*image:[[:space:]]*'?\"?([._:a-zA-Z0-9-]*/?[._a-zA-Z0-9-]*/[._a-zA-Z0-9-]*(@sha256)?:?[._a-zA-Z0-9-]*)'?\"?[[:space:]]*;\1;")
    for image in "${images[@]}"; do
      separators="${image//[^\/]}"
      # Warning, keep in mind: image without registry name is it possible case. It's mean, that image comes from private registry, where is we have organization name, but no registry name...
      digest="${imageMap[${image}]}"

      if [[ -z "${digest}" ]] && [ "${#separators}" == "1" ]; then
        imageWithDefaultRegistry="docker.io/${image}"
        digest="${imageMap[${imageWithDefaultRegistry}]}"
      fi

      if [[ -n "${digest}" ]]; then
        if [[ ${image} == *":"* ]]; then
          imageWithoutTag="${image%:*}"
          tag="${image#*:}"
        else
          imageWithoutTag=${image}
          tag=""
        fi

        REGEX="([[:space:]]*\"?'?)(${imageWithoutTag}):?(${tag})(\"?'?)"
        sed -i -E "s|image:${REGEX}|image:\1\2${digest}\4|" "$meta"
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
