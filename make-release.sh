#!/bin/bash
# Release process automation script. 
# Used to create branch/tag, update VERSION files, create new che-theia and machine-exec plugins,
# and and trigger release by force pushing changes to the release branch 

# set to 1 to actually trigger changes in the release branch
TRIGGER_RELEASE=0 
NOCOMMIT=0

while [[ "$#" -gt 0 ]]; do
  case $1 in
    '-t'|'--trigger-release') TRIGGER_RELEASE=1; NOCOMMIT=0; shift 0;;
    '-r'|'--repo') REPO="$2"; shift 1;;
    '-v'|'--version') VERSION="$2"; shift 1;;
    '-n'|'--no-commit') NOCOMMIT=1; TRIGGER_RELEASE=0; shift 0;;
  esac
  shift 1
done

usage ()
{
  echo "Usage: $0 --repo [GIT REPO TO EDIT] --version [VERSION TO RELEASE] [--trigger-release]"
  echo "Example: $0 --repo git@github.com:eclipse/che-subproject --version 7.7.0 --trigger-release"; echo
}

if [[ ! ${VERSION} ]] || [[ ! ${REPO} ]]; then
  usage
  exit 1
fi

# derive branch from version
BRANCH=${VERSION%.*}.x

# if doing a .0 release, use master; if doing a .z release, use $BRANCH
if [[ ${VERSION} == *".0" ]]; then
  BASEBRANCH="master"
else 
  BASEBRANCH="${BRANCH}"
fi

fetchAndCheckout ()
{
  bBRANCH="$1"
  git fetch origin "${bBRANCH}:${bBRANCH}"; git checkout "${bBRANCH}"
}

# work in tmp dir
TMP=$(mktemp -d); pushd "$TMP" > /dev/null || exit 1

# get sources from ${BASEBRANCH} branch
echo "Check out ${REPO} to ${TMP}/${REPO##*/}"
git clone "${REPO}" -q
cd "${REPO##*/}" || exit 1
fetchAndCheckout "${BASEBRANCH}"

# create new branch off ${BASEBRANCH} (or check out latest commits if branch already exists), then push to origin
if [[ "${BASEBRANCH}" != "${BRANCH}" ]]; then
  git branch "${BRANCH}" || git checkout "${BRANCH}" && git pull origin "${BRANCH}"
  git push origin "${BRANCH}"
  fetchAndCheckout "${BRANCH}"
fi

commitChangeOrCreatePR()
{
  if [[ ${NOCOMMIT} -eq 1 ]]; then
    echo "[INFO] NOCOMMIT = 1; so nothing will be committed. Run this script with no flags for usage + list of flags/options."
  else
    aVERSION="$1"
    aBRANCH="$2"
    PR_BRANCH="$3"

    if [[ ${PR_BRANCH} == *"add"* ]]; then
      COMMIT_MSG="[release] Add ${aVERSION} plugins in ${aBRANCH}"
    else 
      COMMIT_MSG="[release] Bump to ${aVERSION} in ${aBRANCH}"
    fi

    # commit change into branch
    git add v3/plugins/eclipse/ || true
    git commit -s -m "${COMMIT_MSG}" VERSION v3/plugins/eclipse/
    git pull origin "${aBRANCH}"

    PUSH_TRY="$(git push origin "${aBRANCH}")"
    # shellcheck disable=SC2181
    if [[ $? -gt 0 ]] || [[ $PUSH_TRY == *"protected branch hook declined"* ]]; then
      # create pull request for master branch, as branch is restricted
      git branch "${PR_BRANCH}"
      git checkout "${PR_BRANCH}"
      git pull origin "${PR_BRANCH}"
      git push origin "${PR_BRANCH}"
      lastCommitComment="$(git log -1 --pretty=%B)"
      hub pull-request -o -f -m "${lastCommitComment}

${lastCommitComment}" -b "${aBRANCH}" -h "${PR_BRANCH}"
    fi
  fi
}

# generate new meta.yaml files for the plugins, and update the latest.txt files; also update the VERSION file
createNewPlugins () {
  newVERSION="$1"
  thisVERSION="$2" # if false, don't update latest.txt and VERSION file; otherwise use this value in VERSION file and use newVERSION in latest.txt
  rsync -aPrz v3/plugins/eclipse/che-machine-exec-plugin/nightly/* "v3/plugins/eclipse/che-machine-exec-plugin/${newVERSION}/"
  rsync -aPrz v3/plugins/eclipse/che-theia/next/* "v3/plugins/eclipse/che-theia/${newVERSION}/"
  pwd
  for m in "v3/plugins/eclipse/che-theia/${newVERSION}/meta.yaml" "v3/plugins/eclipse/che-machine-exec-plugin/${newVERSION}/meta.yaml"; do
    sed -i "${m}" \
        -e "s#firstPublicationDate:.\+#firstPublicationDate: \"$(date +%Y-%m-%d)\"#" \
        -e "s#version: \(nightly\|next\)#version: ${newVERSION}#" \
        -e "s#image: \"\(.\+\):\(nightly\|next\)\"#image: \"\1:${newVERSION}\"#" \
        -e "s# development version\.##" \
        -e "s#, get the latest release each day\.##"
  done

  # for .0 releases (master and .x branch) update in both branches
  # for .z releases, latest files should be updated in both branch
  for m in v3/plugins/eclipse/che-theia/latest.txt v3/plugins/eclipse/che-machine-exec-plugin/latest.txt; do
    echo "${newVERSION}" > $m
  done
  # for .z releases, VERSION files should not be updated in master branch (only in .z branch)
  if [[ ${thisVERSION} != "false" ]]; then
    # update VERSION file with VERSION or NEWVERSION
    echo "${thisVERSION}" > VERSION
  fi
}

# add new plugins + update latest.txt files, and bump VERSION file to VERSION
createNewPlugins "${VERSION}" "${VERSION}"

# commit change into branch
commitChangeOrCreatePR "${VERSION}" "${BRANCH}" "pr-${BRANCH}-to-${VERSION}"

if [[ $TRIGGER_RELEASE -eq 1 ]]; then
  # push new branch to release branch to trigger CI build
  fetchAndCheckout "${BRANCH}"
  git branch release -f 
  git push origin release -f

  # tag the release
  git checkout "${BRANCH}"
  git tag "${VERSION}"
  git push origin "${VERSION}"
fi

# now update ${BASEBRANCH} to the new snapshot version
fetchAndCheckout "${BASEBRANCH}"

# change VERSION file + commit change into ${BASEBRANCH} branch
if [[ "${BASEBRANCH}" != "${BRANCH}" ]]; then
  # bump the y digit
  [[ $BRANCH =~ ^([0-9]+)\.([0-9]+)\.x ]] && BASE=${BASH_REMATCH[1]}; NEXT=${BASH_REMATCH[2]}; (( NEXT=NEXT+1 )) # for BRANCH=7.10.x, get BASE=7, NEXT=11
  NEXTVERSION="${BASE}.${NEXT}.0-SNAPSHOT"
else
  # bump the z digit
  [[ $VERSION =~ ^([0-9]+)\.([0-9]+)\.([0-9]+) ]] && BASE="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"; NEXT="${BASH_REMATCH[3]}"; (( NEXT=NEXT+1 )) # for VERSION=7.7.1, get BASE=7.7, NEXT=2
  NEXTVERSION="${BASE}.${NEXT}-SNAPSHOT"
fi

# add new plugins + update latest.txt files, and bump VERSION file to NEXTVERSION
createNewPlugins "${VERSION}" "${NEXTVERSION}"
commitChangeOrCreatePR "${NEXTVERSION}" "${BASEBRANCH}" "pr-${BASEBRANCH}-to-${NEXTVERSION}"

# now, if we're doing a 7.y.z release, push new plugins into master branch too (#16476)
if [[ ${BASEBRANCH} != "master" ]]; then
  fetchAndCheckout "master"

  # add new plugins + update latest.txt files; do not update VERSION file in master
  createNewPlugins "${VERSION}" false
  commitChangeOrCreatePR "${VERSION}" "master" "pr-add-${VERSION}-plugins-to-master"
fi

popd > /dev/null || exit

# cleanup tmp dir
cd /tmp && rm -fr "$TMP"
