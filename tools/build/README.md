# Build

This tool is currently generating data at build time so we can remove all plug-ins from the v3/plugins folder that are VS Code Extensions

This tool generates:
- `v3/plugins/**/meta.yaml` based on the file `che-plugins.yaml``

# npm package

The build tool is available at https://www.npmjs.com/package/@eclipse-che/plugin-registry-generator

`@next` alias version will link the current development version.

## Flags
    
### root folder
`--root-folder:/root-path` assume the che-*.yaml files are in this folder

### output folder
`--output-folder:/output-path` assume the generated files will be in this folder

Default to `/tmp/che-plugin-registry/output-folder`

### embed the vsix files
`--embed-vsix:true` will embed the vsix in the generated output folder (and in the OCI image)

Default to false

### Digest generation
By default all generated images tags are using the digest (sha256 link)

Use `--skip-digest-generation:true` to disable it.


## Help

There is a command that is invoked in the Dockerfile to generate these files
Script used is `generate_vscode_extensions.sh` 
