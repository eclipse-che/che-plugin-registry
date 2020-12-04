# Automated Plugin Report

### Report accurate as of: {{reportTime}} UTC / (took {{computeTime}}s)
| Plugin Name | Repository | Registry Version | Upstream Version | Error
| ------ | ------ | ------ | ------ | ------ | ------ | ------
{{#each entries}}
| {{this.extensionName}} | [{{this.repositoryName}}]({{this.repositoryName}}) | {{this.registryVersion}} | {{#if this.extensionNeedsUpdating}}**{{/if}}{{this.upstreamVersion}}{{#if this.extensionNeedsUpdating}}**{{/if}} | {{this.errors}}
{{/each}}
