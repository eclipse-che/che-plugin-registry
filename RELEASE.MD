# che-plugin-registry
## Major / Minor Release

- create and checkout release branch e.g. `7.8.x`
- bump the `VERSION` file to the release version e.g. `7.8.0`
- adding `7.8.0` versions of the `che-machine-exec`, `che-theia` plugins and bumping `latest.txt` file of those plugins to `7.8.0`
- updating container runtime image tag of the `theia-dev` plugin to `7.8.0`
- sent PR with the changes above to the `7.8.x` branch.
 
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
- providing a PR with adding the latest `7.8.0` versions of the `che-theia` and `che-machine-exec` to master.

## Service / Bugfix  Release

- checkout already existing release branch e.g. `7.7.x`
- bump the `VERSION` file to the bugfix release version e.g. `7.7.1`
- adding `7.7.1` versions of the `che-machine-exec`, `che-theia` plugins and bumping `latest.txt` file of those plugins to `7.7.1`
- updating container runtime image tag of the `theia-dev plugin` to `7.7.1`
- sent PR with the changes above to the `7.7.x` branch. PR example - https://github.com/eclipse/che-plugin-registry/pull/353
 
In order to trigger the CI once the [PR](https://github.com/eclipse/che-plugin-registry/pull/353) is merged to the `7.7.x` one needs to:

```
 git fetch origin 7.7.x:7.7.x
 git checkout 7.7.x
 git branch release -f 
 git push origin release -f
```

[CI](https://ci.centos.org/job/devtools-che-plugin-registry-release/) will build an image from the [`release`](https://github.com/eclipse/che-plugin-registry/tree/release) branch and push it to [quay.io](https://quay.io/organization/eclipse) e.g [quay.io/eclipse/che-plugin-registry:7.7.1](https://quay.io/repository/eclipse/che-plugin-registry?tab=tags&tag=7.7.1)

The last things that need to be done:
- the `7.7.1` tag creation from the `7.7.x` branch
- providing a PR with adding the latest 7.7.1 versions of the che-theia and che-machine-exec to master - https://github.com/eclipse/che-plugin-registry/pull/354

