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

