# Automated Plugin Report

### Report accurate as of: {{reportTime}} UTC / (took {{computeTime}}s)
| Plugin Name | Repository | Registry Version | Upstream Version | Error |
| ------ | ------ | ------ | ------ | ------
{{#each entries}}
| {{this.extensionName}} | [{{this.repositoryName}}]({{this.repositoryName}}) | {{this.registryVersion}} | {{#if this.needsUpdating}}**{{/if}}{{this.upstreamVersion}}{{#if this.needsUpdating}}**{{/if}} | {{this.errors}} 
{{/each}}
