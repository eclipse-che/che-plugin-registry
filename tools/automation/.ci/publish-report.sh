#!/bin/bash
# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

set -e
set -o pipefail

yarn
cd ./tools/automation
yarn run compile
node ./lib/check-plugin-updates.js
cd ./report
../../../node_modules/.bin/vuepress build
git config --global user.email "che-bot@eclipse.org"
git config --global user.name "CHE Bot"
rm -rf che-plugin-registry
git clone -b gh-pages "https://github.com/$GITHUB_REPOSITORY.git"
cd che-plugin-registry
git rm -r assets ./*.html
cp -rf ../.vuepress/dist/* .
git add assets ./*.html
git commit -m "Automated Plugin Report - $(date)" -s
git push "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git" gh-pages
