# Adding a VS Code extension to Che
Che uses a similar system to OpenVSX when it comes to adding VS Code extensions. In the root of this repository is a [`che-theia-plugins.yaml`](./che-theia-plugins.yaml) file. In order to add/update a VS Code extension in Che, simply add/edit this file with the relevant extension information.

Here is the expected format of a [`che-theia-plugins.yaml`](./che-theia-plugins.yaml) plugin entry:

```yaml
  - repository:
      # Repository URL to clone and from
      url: https://github.com/redhat-developer/vscode-java
      # Tag or SHA1 ID of the upstream repository that hosts the extension, usually corresponding to a version/snapshot/release.
      revision: v0.69.0
    # Direct link(s) to the vsix files included with this plugin. The vsix build by the repository specified must be listed first
    extensions:
      - https://download.jboss.org/jbosstools/static/jdt.ls/stable/java-0.69.0-2547.vsix
      - https://download.jboss.org/jbosstools/vscode/3rdparty/vscode-java-debug/vscode-java-debug-0.26.0.vsix
      - https://open-vsx.org/api/vscjava/vscode-java-test/0.24.0/file/vscjava.vscode-java-test-0.24.0.vsix
```

Here are all the supported values, including optional ones:

```yaml
  # (OPTIONAL) The ID of the plugin, useful if a plugin has multiple entries for one repository (for example, Java 8 vs. Java 11)
  - id: redhat/java11
  # Repository information about the plugin. If ID is specified then this field is not a list element.
  - repository:
      # Repository URL to clone and from
      url: https://github.com/redhat-developer/vscode-java
      # Tag or SHA1 ID of the upstream repository that hosts the extension, usually corresponding to a version/snapshot/release.
      revision: v0.69.0
    # (OPTIONAL) An alias for this plugin: this means anything listed here will get its own meta.yaml generated
    aliases:
      - redhat/java
    # (OPTIONAL) If the plugin runs in a sidecar, then the sidecar information is specified here
    sidecar:
      # Directory where the Dockerfile that builds this extension is located
      directory: java
      # (OPTIONAL) The name of the container
      name: vscode-java
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
          path: "/home/theia/.m2"
      # (OPTIONAL) Any endpoint information for the container
      endpoints:
          # Endpoint name
        - name: "configuration-endpoint"
          # Whether or not the endpoint is exposed publically or not
          public: true
          # The port number
          targetPort: 61436
          # Attributes relating to the endpoint
          attributes:
            protocol: http
    # Direct link(s) to the vsix files included with this plugin. The vsix build by the repository specified must be listed first
    extensions:
      - https://download.jboss.org/jbosstools/static/jdt.ls/stable/java-0.69.0-2547.vsix
      - https://download.jboss.org/jbosstools/vscode/3rdparty/vscode-java-debug/vscode-java-debug-0.26.0.vsix
      - https://open-vsx.org/api/vscjava/vscode-java-test/0.24.0/file/vscjava.vscode-java-test-0.24.0.vsix
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
          type: ide
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
          type: ide
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
          path: "/home/theia/.m2"

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
          path: "/home/theia/path"          
```

# Adding a Che Plugin to Che (Not a VS Code extension or a Theia Plug-in)
Che supports plug-ins. These plug-ins are not VS Code extensions, and only bring new endpoints and containers. In the root of this repository is a [`che-plugins.yaml`](./che-plugins.yaml) file. In order to add/update a Che Plugin in Che, simply add/edit this file with the relevant plug-in information.

Here is the expected format of a [`che-plugins.yaml`](./che-plugins.yaml) editor entry:

```yaml
  - id: my/plugin/1.0.0
    displayName: Foo container
    description: Brings Foo Container on top of Eclipse Che Workspace
    icon: http://my-nice-icon.foobar/icon.png
    repository: https://my-git-repository-foo-bar.com/
    firstPublicationDate: "2020-01-01"
    containers:
      - name: my-foo-container
        image: "quay.io/image:foo"
        mountSources: true
        memoryLimit: "512M"
```

Here are all the supported values, including optional ones:

```yaml
    # The ID of the che plugin
  - id: my/plugin/1.0.0
    # Meta information of the plug-in
    displayName: Foo container
    description: Brings Foo Container on top of Eclipse Che Workspace
    icon: http://my-nice-icon.foobar/icon.png
    firstPublicationDate: "2020-01-01"
    # Repository information about the plug-in.
    repository: https://my-git-repository-foo-bar.com/
    #(OPTIONAL) Specify endpoints
    endpoints:
      - # Name of the endpoint
        name: "endpoint-name"
        # public
        public: <boolean>
        # listening port of the endpoint in the container
        targetPort: 8080
        # optional attributes
        attributes:
          protocol: http
          ...
    # Specify at least one container
    containers:
      - # Name of the container
        name: my-foo-container
        # image of the container
        image: "quay.io/image:foo"
        # (OPTIONAL) Any environment variable entry for the container
        env:
          # The name of the environment variable
          - name: MY_KEY
          # The value of the environment variable
            value: my-value
        volumeMounts:
          # The name of the mount
        - name: m2
          # The path of the mount
          path: "/home/theia/.m2"
        # (OPTIONAL) mount the source code of the projects in the container
        mountSources: true
        # (OPTIONAL) ports exposed by this container
        ports:
         - 
           # Should at least expose the port used by endpoint (if any)
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

    # (OPTIONAL) Any init container
    initContainers:
      - # Name of the container
        name: my-foo-container
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
          path: "/home/theia/path"          
```

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
Now that the sidecar image has been built and pushed, the second PR can make use of it. The second PR will be the one that modifies the [`che-theia-plugins.yaml`](./che-theia-plugins.yaml) file.
