#!/bin/bash
#
# Copyright (c) 2012-2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#

# Download referenced extension artifacts to <plugin root>/resources
# Arguments:
# 1 - plugin root folder, e.g. 'v3'

set -e

if [[ $2 == "--latest-only" ]]; then
  readarray -d '' metas < <(find "$1" -name 'meta.yaml' | grep "/latest/" | tr "\r\n" "\0")
else
  readarray -d '' metas < <(find "$1" -name 'meta.yaml' -print0)
fi

RESOURCES_DIR="${1}/resources/"
TEMP_DIR="${1}/extensions_temp/"

mkdir -p "${RESOURCES_DIR}" "${TEMP_DIR}"

# Unpack prebuilt .vsix files, if archive exists
# File structure for the archive must mirror structure used for storing downloaded
# vsix files (i.e. .vsix files are stored in subdirs according to the path in their
# URL)
PREBUILT_VSIX_ARCHIVE_NAME="${1}/vsix.tar.gz"
if [ -f "${PREBUILT_VSIX_ARCHIVE_NAME}" ]; then
  echo "Found ${PREBUILT_VSIX_ARCHIVE_NAME}, unpacking"
  tar -zxvf "${PREBUILT_VSIX_ARCHIVE_NAME}" -C "${TEMP_DIR}"
  mv "${TEMP_DIR%/}/vsix"/* "${RESOURCES_DIR}"
  rm -rf "${PREBUILT_VSIX_ARCHIVE_NAME}" "${TEMP_DIR:?}"/*
fi

# Download required extension files and update plugin meta.yamls as necessary
for extension in $(yq -r '.spec.extensions[]?' "${metas[@]}" | sort | uniq); do
  echo "Caching extension ${extension}"

  # Strip protocol and filename from URL to get destination path for vsix file
  relative_subdir="${extension#*//}"
  relative_subdir="${relative_subdir%/*}"
  mkdir -p "${RESOURCES_DIR%/}/${relative_subdir}"

  # Path to current extension's .vsix file, relative to $RESOURCES_DIR
  extension_location=""

  readarray -d '' prebuilt_extension < <(find "${RESOURCES_DIR%/}/${relative_subdir}" -name '*.vsix' -print0)
  if [ "${#prebuilt_extension[@]}" = 1 ]; then
    # We found a prebuilt extension in this directory, no need to download
    echo "    Found prebuilt extension ${prebuilt_extension[0]}"
    extension_location="${prebuilt_extension[0]#${RESOURCES_DIR}}"
  elif [ "${#prebuilt_extension[@]}" = 0 ]; then
    # No vsix files in target directory 
    echo "    Downloading extension $extension"
    wget -P "${TEMP_DIR}" -nv --content-disposition "${extension}"
    file=$(find "${TEMP_DIR}" -type f)
    filename=$(basename "${file}")
    extension_location="${relative_subdir%/}/${filename}"
    if [ -f "${RESOURCES_DIR%/}/${extension_location}" ]; then
      echo "    Encoutered duplicate file: ${RESOURCES_DIR%/}/${extension_location}"
      echo "    while processing ${extension}"
      exit 1
    fi
    mv "${file}" "${RESOURCES_DIR%/}/${extension_location}"
  else
    echo "    Found multiple extensions in directory ${RESOURCES_DIR%/}/${relative_subdir}; unable to determine"
    echo "    which file is used for extension ${extension}"
    exit 1
  fi

  echo "    Rewriting meta.yaml '${extension}' -> 'relative:extension/resources/${extension_location#/}'"
  sed -i "s|${extension}|relative:extension/resources/${extension_location#/}|" "${metas[@]}"
done

rm -rf "${TEMP_DIR}"
