## Major / Minor Release

Below are the steps needed to do a release. But rather than doing them by hand, you can run this script:

https://github.com/eclipse/che-plugin-registry/blob/master/make-release.sh

HOWEVER, because the master branch is protected from commits, the above script will not be able to commit an update to the VERSION file. Instead it must produce a PR.

```
remote: error: GH006: Protected branch update failed for refs/heads/master.
remote: error: At least 1 approving review is required by reviewers with write access.
To github.com:eclipse/che-plugin-registry
 ! [remote rejected] master -> master (protected branch hook declined)
```
- create a branch for the release e.g. `7.8.x`
- provide a [PR](https://github.com/eclipse/che-plugin-registry/pull/171) with bumping the [VERSION](https://github.com/eclipse/che-plugin-registry/blob/master/VERSION) file to the `7.8.x` branch
- [![Release Build Status](https://ci.centos.org/buildStatus/icon?subject=release&job=devtools-che-plugin-registry-release/)](https://ci.centos.org/job/devtools-che-plugin-registry-release/) CI is triggered based on the changes in the [`release`](https://github.com/eclipse/che-plugin-registry/tree/release) branch (not `7.8.x`).
- add `7.8.0` versions of the `che-machine-exec` and `che-theia` plugins and bump `latest.txt` files of those plugins to `7.8.0`
- update container runtime image tag of the `theia-dev` plugin to `7.8.0`
- submit PR with the changes above to the `7.8.x` branch.
 
In order to trigger the CI once the PR is merged to the `7.8.x` one needs to:

```
 git fetch origin 7.8.x:7.8.x
 git checkout 7.8.x
 git branch release -f 
 git push origin release -f
```

[CI](https://ci.centos.org/job/devtools-che-plugin-registry-release/) will build an image from the [`release`](https://github.com/eclipse/che-plugin-registry/tree/release) branch and push it to [quay.io](https://quay.io/organization/eclipse) e.g [quay.io/eclipse/che-plugin-registry:7.8.0](https://quay.io/repository/eclipse/che-plugin-registry?tab=tags&tag=7.8.0)

The last things that need to be done:

- the `7.8.0` tag creation from the `7.8.x` branch
- provide a PR to add the latest `7.8.0` versions of the `che-theia` and `che-machine-exec` plugins to the master branch, including updates to `latest.txt` files.

After the release, the `VERSION` file should be bumped in the master branch, e.g. to `7.9.0-SNAPSHOT`.

## Service / Bugfix  Release

The release process is the same as for the Major / Minor one, but the values passed to the `make-release.sh` script will differ so that work is done in the existing 7.7.x branch.

```
./make-release.sh --repo git@github.com:eclipse/che-plugin-registry --version 7.7.1 --trigger-release
```

Note that nNew che-machine-exec and che-theia plugins for the 7.7.1 release should ALSO be added to the master branch.

