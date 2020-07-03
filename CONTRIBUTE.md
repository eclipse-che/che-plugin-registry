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
      "revision": "0.8.0"
    },
```
The file is sorted alphabetically A - Z, based on the repository name (i.e. `vscode-yaml`).

Automation is in progress to automate the testing and validation of extensions in this JSON file. Stay tuned for more updates as this work is ongoing.