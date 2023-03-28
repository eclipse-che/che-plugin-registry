# Adding a VS Code extension to the embedded open-vsx registry
In the root of this repository is a [`openvsx-sync.json`](./openvsx-sync.json) file. In order to add/update a VS Code extension in embedded open-vsx registry, simply edit this file with the relevant extension information.

Here is the expected format of a [`openvsx-sync.json`](./openvsx-sync.json) plugin entry:

```json
  {
    "id": "publisher.name",
    "download": "url_to_downlod_vsix",
    "version": "extension_version"
  }
```

Here are all the supported values, including optional ones:

```json
  {
    // (REQUIRED) The ID of the plugin. When identifying an extension, provide the full name of the form publisher.extension, for example ms-python.python
    // The latest extension version on open-vsx.org is the default. Alternatively, you can add "version": "<extension_version>" on a new line to specify a version.
    "id": "<publisher>.<extension>",
    // (OPTIONAL) The link to the vsix file of the extension (if not provided, the extension will be downloaded)
    "download": "<url_to_download_vsix_file>",
    // (OPTIONAL) The version of the extension (if not provided, the latest version will be used)
    "version": "<extension_version>"
  }
```

# Adding a Che Editor to Che
Che supports multiple editors and each workspace can use its own editor. In the root of this repository is a [`che-editors.yaml`](./che-editors.yaml) file. In order to add/update a Che Editor in Che, simply add/edit this file with the relevant editor information.

Here is the expected format of a [`che-editors.yaml`](./che-editors.yaml) editor entry:

```yaml
  - id: my/editor/1.0.0
    title: This is my editor
    displayName: Editor Name
    description: Run Editor Foo on top of Eclipse Che
    icon: http://my-nice-icon.foobar/icon.png
    repository: https://my-git-repository-foo-bar.com/
    firstPublicationDate: "2020-01-01"
    endpoints:
      - name: "editor-name"
        public: true
        targetPort: 8080
        attributes:
          protocol: http
          type: main
    containers:
      - name: my-editor-container
        image: "quay.io/image:foo"
        mountSources: true
        ports:
         - exposedPort: 8080
        memoryLimit: "512M"
```

Here are all the supported values, including optional ones:

```yaml
    # The ID of the editor
  - id: my/editor/1.0.0
    # Meta information of the editor
    title: This is my editor
    displayName: Editor Name
    description: Run Editor Foo on top of Eclipse Che
    icon: http://my-nice-icon.foobar/icon.png
    firstPublicationDate: "2020-01-01"
    # Repository information about the editor.
    repository: https://my-git-repository-foo-bar.com/
    # Specify at least one endpoint
    endpoints:
      - # Name of the editor
        name: "editor-name"
        # public
        public: true
        # listening port of the editor in the container
        targetPort: 8080
        # the type should be ide to be an editor
        attributes:
          protocol: http
          type: main
    # Specify at least one container
    containers:
      - # Name of the container
        name: my-editor-container
        # image of the container
        image: "quay.io/image:foo"
        # (OPTIONAL) Any environment variable entry for the container
        env:
          # The name of the environment variable
          - name: MY_KEY
          # The value of the environment variable
            value: my-value
        # (OPTIONAL) mount the source code of the projects in the container
        # Should be true for the editor's container as usually editor is to open files from projects
        mountSources: true
        # (OPTIONAL) ports exposed by this container
        ports:
         - 
           # Should at least expose the port used by the default endpoint
           exposedPort: 8080
        # (OPTIONAL) The memory limit of the container
        memoryLimit: "1500Mi"
        # (OPTIONAL) The memory request of the container
        memoryRequest: "1000Mi"
        # (OPTIONAL) The CPU limit of the container
        cpuLimit: "500m"
        # (OPTIONAL) The CPU request of the container
        cpuRequest: "125m"
        # (OPTIONAL) Any volume mounting information for the container
        volumeMounts:
          # The name of the mount
        - name: m2
          # The path of the mount
          path: "/home/user/.m2"

    # (OPTIONAL) Any init container
    initContainers:
      - # Name of the container
        name: my-editor-container
        # image of the container
        image: "quay.io/image:foo"
        # (OPTIONAL) Any environment variable entry for the container
        env:
          # The name of the environment variable
          - name: MY_KEY
          # The value of the environment variable
            value: my-value
        # (OPTIONAL) Any volume mounting information for the container
        volumeMounts:
          # The name of the mount
        - name: my-path
          # The path of the mount
          path: "/home/user/path"          
```

## Registry Publishing
### Pull Requests
All PRs in the plugin registry are published to [surge.sh](https://surge.sh/), for ease of testing. This means that a CI job will automatically build the plugin registry with a PR's changes, and publish it. The resulting link can then be used to test the PR inside Che, without needing to create a `devfile.yaml` file.

The job names are `surge`. Clicking on `Details` in the GitHub PR view will take you to the surge.sh link. Alternatively, you can look at the link directly, which is in the following format: `https://pr-check-<PR_NUMBER>-che-plugin-registry.surge.sh/`

For example, build of PR 805 would be hosted at: https://pr-check-805-che-plugin-registry.surge.sh/

### Next
A next build of the plugin registry is published on both [surge.sh](https://che-plugin-registry-main.surge.sh/), and [GitHub Pages](https://eclipse-che.github.io/che-plugin-registry/main/). Both are updated upon every commit merged to the main branch.

### Versioned Releases
Versioned releases of the che-plugin-registry are also published to GitHub Pages. The version of the release is name of the last folder in the URL.

For example, the `7.29.0` version of the plugin registry would be published at https://eclipse-che.github.io/che-plugin-registry/7.29.0/
