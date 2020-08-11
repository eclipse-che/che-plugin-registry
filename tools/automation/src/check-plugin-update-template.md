# Automated Plugin Report

### Report accurate as of: {{reportTime}} UTC / (took {{computeTime}}s)
| Plugin Name | Repository | Registry Version | Upstream Version | Registry Sidecar Image | Upstream Sidecar Image | Error
| ------ | ------ | ------ | ------ | ------ | ------ | ------
{{#each entries}}
| {{this.extensionName}} | [{{this.repositoryName}}]({{this.repositoryName}}) | {{this.registryVersion}} | {{#if this.extensionNeedsUpdating}}**{{/if}}{{this.upstreamVersion}}{{#if this.extensionNeedsUpdating}}**{{/if}} | [{{this.registrySidecarImage}}]({{this.sidecarLocation}}) | [{{#if this.sidecarNeedsUpdating}}**{{/if}}{{this.upstreamSidecarImage}}{{#if this.sidecarNeedsUpdating}}**{{/if}}]({{this.sidecarLocation}}) | {{this.errors}}
{{/each}}
