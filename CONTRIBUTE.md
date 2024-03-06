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
  - schemaVersion: 2.2.2
    metadata:
      name: ws-skeleton/jupyter/5.7.0
      displayName: Jupyter Notebook
      description: Jupyter Notebook for Eclipse Che
      icon: /images/notebook.svg
      attributes:
        publisher: ws-skeleton
        version: 5.7.0
        title: Jupyter Notebook for Eclipse Che
        repository: 'https://github.com/ws-skeleton/che-editor-jupyter/'
        firstPublicationDate: '2019-02-05'
    components:
      - name: jupyter-notebook
        container:
          image: "docker.io/ksmster/che-editor-jupyter:5.7.0"
          env:
            - name: JUPYTER_NOTEBOOK_DIR
              value: /projects
          mountSources: true
          memoryLimit: 512M
          endpoints:
            - name: jupyter
              targetPort: 8888
              exposure: public
              protocol: https
              attributes:
                type: main
        attributes:
          ports:
            - exposedPort: 8888
```

Here are all the supported values, including optional ones:

```yaml
  # Version of the devile schema
  - schemaVersion: 2.2.2
    # Meta information of the editor
    metadata:  
      # The name of the editor. It should include publisher, name and version of the editor
      name: publisher/name/version
      displayName: Editor Name
      description: Run Editor Foo on top of Eclipse Che
      # Editor's icon. The icon should be located in /images folder.
      icon: /images/editor_icon.svg
      # (OPTIONAL) Additional attributes
      attributes:
        title: This is my editor
        publisher: publisher
        version: version
        repository: https://github.com/editor/repository/
        firstPublicationDate: '2024-01-01'
    # List of editor components
    components:
      # Name of the component
      - name: che-code-injector
        # Configuration of devworkspace-related container 
        container:
          # Image of the container
          image: 'quay.io/che-incubator/che-code:insiders'
          # The command to run in the dockerimage component instead of the default one provided in the image
          command:
            - /entrypoint-init-container.sh
          # (OPTIONAL) List of volumes mounts that should be mounted in this container 
          volumeMounts:
              # The name of the mount
            - name: checode
              # The path of the mount
              path: /checode
          # (OPTIONAL) The memory limit of the container
          memoryLimit: 256Mi
          # (OPTIONAL) The memory request of the container
          memoryRequest: 32Mi
          # (OPTIONAL) The CPU limit of the container
          cpuLimit: 500m
          # (OPTIONAL) The CPU request of the container
          cpuRequest: 30m
      # Name of the component
      - name: che-code-runtime-description
        # (OPTIONAL) Map of implementation-dependant free-form YAML attributes
        attributes:
          # The component within the architecture
          app.kubernetes.io/component: che-code-runtime
          # The name of a higher level application this one is part of
          app.kubernetes.io/part-of: che-code.eclipse.org
          # Defines a container component as a "container contribution". If a flattened DevWorkspace has a container component with the merge-contribution attribute, then any container contributions are merged into that container component
          controller.devfile.io/container-contribution: true
        container:
          # Can be dummy image because the compoent is expected to be injected into workspace dev component
          image: quay.io/devfile/universal-developer-image:latest
          # (OPTIONAL) List of volumes mounts that should be mounted in this container 
          volumeMounts:
              # The name of the mount
            - name: checode
              # (OPTIONAL) The path in the component container where the volume should be mounted. If not path is mentioned, default path is the is /<name>
              path: /checode
          # (OPTIONAL) The memory limit of the container
          memoryLimit: 1024Mi
          # (OPTIONAL) The memory request of the container
          memoryRequest: 256Mi
          # (OPTIONAL) The CPU limit of the container
          cpuLimit: 500m
          # (OPTIONAL) The CPU request of the container
          cpuRequest: 30m
          # (OPTIONAL) Environment variables used in this container
          env:
            - name: ENV_NAME
              value: value
          # Component endpoints
          endpoints:
            # Name of the editor 
            - name: che-code
              # (OPTIONAL) Map of implementation-dependant string-based free-form attributes
              attributes:
                # Type of the endpoint. It only allows for it's value to be set to main  which indicates that the endpoint should be used as the mainUrl in the workspace status (i.e. it should be the URL used to access the editor in this context)
                type: main
                # An attribute that instructs the service to automatically redirect the unauthenticated requests for current user authentication. Setting this attribute to true has security consequences because it makes Cross-site request forgery (CSRF) attacks possible. The default value of the attribute is false. 
                cookiesAuthEnabled: true
                # Defines an endpoint as "discoverable", meaning that a service should be created using the endpoint name (i.e. instead of generating a service name for all endpoints, this endpoint should be statically accessible)
                discoverable: false
                # Used to secure the endpoint with authorization on OpenShift, so that not anyone on the cluster can access the endpoint, the attribute enables authentication. 
                urlRewriteSupported: true
              # Port number to be used within the container component
              targetPort: 3100
              # (OPTIONAL) Describes how the endpoint should be exposed on the network (public, internal, none)
              exposure: public
              # (OPTIONAL) Describes whether the endpoint should be secured and protected by some authentication process
              secure: true
              # (OPTIONAL) Describes the application and transport protocols of the traffic that will go through this endpoint
              protocol: https
        # Mandatory name that allows referencing the component from other elements
      - name: checode
        # (OPTIONAL) Allows specifying the definition of a volume shared by several other components. Ephemeral volumes are not stored persistently across restarts. Defaults to false
        volume: {ephemeral: true}
    # (OPTIONAL) Bindings of commands to events. Each command is referred-to by its name
    events:
      # IDs of commands that should be executed before the devworkspace start. This commands would typically be executed in init container
      preStart:
        - init-container-command
      # IDs of commands that should be executed after the devworkspace is completely started. In the case of Che-Code, these commands should be executed after all plugins and extensions have started, including project cloning. This means that those commands are not triggered until the user opens the IDE in his browser
      postStart:
        - init-che-code-command
    # (OPTIONAL) Predefined, ready-to-use, devworkspace-related commands
    commands:
        # Mandatory identifier that allows referencing this command
      - id: init-container-command
        apply:
          # Describes component to which given action relates
          component: che-code-injector
        # Mandatory identifier that allows referencing this command
      - id: init-che-code-command
        # CLI Command executed in an existing component container
        exec:
          # Describes component to which given action relates
          component: che-code-runtime-description
          # The actual command-line string
          commandLine: 'nohup /checode/entrypoint-volume.sh > /checode/entrypoint-logs.txt
            2>&1 &'        
```

To run a workspace using a new editor you need to build a link:
`https://<che-host>/#<sample-git-repo>?che-editor=<editor-definition-raw-url>`. Where:
- `che-host` is an Eclipse Che instance like `https://devspaces.apps.sandbox-stage.gb17.p1.openshiftapps.com/`
- `git-repo` is a repository with a project that should be cloned into the workspace
- `editor-definition-raw-url` is an URL to the raw content of your editor definition 

## Registry Publishing
### Pull Requests
All PRs in the plugin registry are published to [surge.sh](https://surge.sh/), for ease of testing. This means that a CI job will automatically build the plugin registry with a PR's changes, and publish it. The resulting link can then be used to test the PR inside Che, without needing to create a `devfile.yaml` file.

The job names are `surge`. Clicking on `Details` in the GitHub PR view will take you to the surge.sh link. Alternatively, you can look at the link directly, which is in the following format: `https://pr-check-<PR_NUMBER>-che-plugin-registry.surge.sh/`

For example, build of PR 805 would be hosted at: https://pr-check-805-che-plugin-registry.surge.sh/

### Next
A next build of the plugin registry is published on both [surge.sh](https://che-plugin-registry.surge.sh/), and [GitHub Pages](https://eclipse-che.github.io/che-plugin-registry/main/). Both are updated upon every commit merged to the main branch.

The editor definition can be found by URL: `https://pr-check-<PR_NUMBER>-che-plugin-registry.surge.sh/v3/plugins/<publisher>/<name>/<version>/devfile.yaml`

### Versioned Releases
Versioned releases of the che-plugin-registry are also published to GitHub Pages. The version of the release is name of the last folder in the URL.

For example, the `7.29.0` version of the plugin registry would be published at https://eclipse-che.github.io/che-plugin-registry/7.29.0/
