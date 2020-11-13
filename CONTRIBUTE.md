# Adding a VS Code extension to Che
Che uses a similar system to OpenVSX when it comes to adding VS Code extensions. In the root of this repository is a [`vscode-extensions.json`](./vscode-extensions.json) file. In order to add/update a VS Code extension in Che, simply add/edit this file with the relevant extension information.

Here is the expected format of an [`vscode-extensions.json`](./vscode-extensions.json) entry:

```js
    {
      // Repository URL to clone and publish from
      "repository": "https://github.com/redhat-developer/vscode-yaml",
      // Tag or SHA1 ID of the upstream repository that hosts the extension, usually corresponding to a version/snapshot/release.
      "revision": "0.8.0"
    },
```

Here are all the supported values, including optional ones:

```js
    {
      // (OPTIONAL) The subfolder where the code to build the VS Code extension is located, in the event it's not located at the repository root.
      "directory": "extension/vscode-yaml/",
      // Repository URL to clone and publish from
      "repository": "https://github.com/redhat-developer/vscode-yaml",
      // Tag or SHA1 ID of the upstream repository that hosts the extension, usually corresponding to a version/snapshot/release.
      "revision": "0.8.0",
      // (OPTIONAL) Details about the plugin's sidecar container, if one exists
      "sidecar": {
        // The image location
        "image": "quay.io/eclipse/che-sidecar-node:10-0cb5d78",
        // Source details about the Dockerfile that builds the sidecar image
        "source": {
          // Repository URL where the Dockerfile is located
          "repository": "https://github.com/che-dockerfiles/che-sidecar-node",
          // (OPTIONAL) Tag or SHA1 ID of the sidecar repository, in the event that the Dockerfile is not located on the default branch
          "revision": "10",
          // (OPTIONAL) The subfolder where the Dockerfile is located, in the event that the Dockerfile is not located at the repository root
          "directory": "./subfolder/foo"
        }
      }
    },
```
The file is sorted alphabetically A - Z, based on the repository name (i.e. `vscode-yaml`).

Automation is in progress to automate the testing and validation of extensions in this JSON file. Stay tuned for more updates as this work is ongoing.

## Sidecars
Sometimes a VS Code extension will need to run in a sidecar container. Any plugin can run in any of the sidecar containers already defined in this repository. If an extension needs a specialized container not already available, then a new sidecar can be contributed.

### How It Works
All sidecar definitions are located in the `sidecars/` directory of this repository. Each directory within the `sidecars/` directory represents a sidecar container, and the name of that sub-directory will be the name of the container. For example, the directory `sidecars/java` means there is a sidecar container named `java`.

There are three things needed when contributing a sidecar:
* The `Dockerfile` that builds the container image
* A `PLATFORMS` file which lists all the architectures your container will be built for
* An entrypoint script, which allows your sidecar image to be used in Che. Here is an [example](https://github.com/eclipse/che-plugin-registry/blob/master/sidecars/node/etc/entrypoint.sh) of such a script. The script needs to be included in the sidecar directory, and also be added to the `Dockerfile` via the `ADD` instruction. Additional scripts may also be contributed and added.

### Contribution Flow
At this time, updating/adding a new plugin and sidecar requires two PRs.

#### PR 1: Sidecar Changes
1. Make the changes necessary to add the sidecar, or update an existing one.
2. Open a PR with the changes.
3. A PR check will run to validate that the sidecar builds. Reviewers will then review the PR.
4. When the PR is merged, a CI job will build the image, and push it to `quay.io/eclipse/che-plugin-sidecar`. Such CI jobs run via GitHub action and can be monitored [here](https://github.com/eclipse/che-plugin-registry/actions).

The resulting image built and pushed via GitHub action will be named according to the directory name, and the shortened commit hash that last changed its definition. For example, if commit `b8f0528` was a change made to the `java` sidecar, then the resulting image from that change will be named `java-b8f0528`. You can check for new images by checking the [quay.io web interface](https://quay.io/repository/eclipse/che-plugin-sidecar?tag=latest&tab=tags), or by checking the console log of the GitHub action job that built and pushed the image.

One PR can modify/add/remove multiple sidecars, they do not need to be split up into separate PRs.

#### PR 2: Plugin Changes
Now that the sidecar image has been built and pushed, the second PR can make use of it. The second PR will be the one that modifies the [`vscode-extensions.json`](./vscode-extensions.json) file, as well as any `meta.yaml` files needed for the change.