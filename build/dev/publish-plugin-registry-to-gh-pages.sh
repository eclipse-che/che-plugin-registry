#!/bin/bash
#
# Copyright (c) 2018-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
set -e

: "${GITHUB_ACTOR:?Variable not set or empty}"
: "${GITHUB_TOKEN:?Variable not set or empty}"

DEFAULT_BUILD_DIR="/projects/che-plugin-registry/output"
BUILD_DIR=${BUILD_DIR:-$DEFAULT_BUILD_DIR}
echo "BUILD_DIR: $BUILD_DIR"
ls -l "$BUILD_DIR"

DEFAULT_GH_PAGES_DIR="/projects/gh-pages"
GH_PAGES_DIR=${GH_PAGES_DIR:-$DEFAULT_GH_PAGES_DIR}

DEFAULT_GITHUB_REPO_NAME="che-plugin-registry"
GITHUB_REPO_NAME=${GITHUB_REPO_NAME:-$DEFAULT_GITHUB_REPO_NAME}

DEFAULT_GITHUB_REPOSITORY="$GITHUB_ACTOR/$GITHUB_REPO_NAME"
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-$DEFAULT_GITHUB_REPOSITORY}

DEFAULT_VERSION_DIR="next"
VERSION_DIR=${VERSION_DIR:-$DEFAULT_VERSION_DIR}
echo "VERSION_DIR: $VERSION_DIR"

rm "$GH_PAGES_DIR" -rf;
mkdir "$GH_PAGES_DIR"
cd "$GH_PAGES_DIR"
echo "GH Pages dir: $(pwd)"
ls -l "$GH_PAGES_DIR"

rm -rf che-plugin-registry
git clone -b gh-pages "https://github.com/$GITHUB_REPOSITORY.git" "$GITHUB_REPO_NAME"
cd "$GITHUB_REPO_NAME"
[ -d "$VERSION_DIR" ] && git rm -r "$VERSION_DIR"
cp -rf "$BUILD_DIR" "$VERSION_DIR"
# Make devfile.yaml as index
while IFS= read -r -d '' file
do
  PARENT_DIR=$(dirname "$file");
  cp "${PARENT_DIR}"/devfile.yaml "${PARENT_DIR}"/index.json;
done <   <(find . -name 'devfile.yaml' -type f -print0)
git add "$VERSION_DIR"
git config user.email "che-bot@eclipse.org"
git config user.name "CHE Bot"
git diff-index --quiet HEAD || git commit -m "publish registry $VERSION_DIR - $(date)" -s
git push "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git" gh-pages
echo "Plugin registry (single-arch) published to https://eclipse-che.github.io/$GITHUB_REPO_NAME/$VERSION_DIR/v3/plugins/"
