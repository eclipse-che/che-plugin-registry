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