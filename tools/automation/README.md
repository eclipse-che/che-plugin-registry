# Automation

Most Che plugins depend on VS Code extensions, and these are usually hosted on other repositories. Sometimes these extensions can be out of date,
as a newer version of the extension has been released upstream. All such plugins are listed in a file `vscode-extensions.json`, which sits at the root
of this repository.

This directory contains various scripts which automate various maintenance steps of the registry.

## Automatic Plugin Reports

Every day at 01:00 UTC, the `vscode-extensions.json` file is parsed and a report is generated. The report can be found at https://eclipse.github.io/che-plugin-registry/

The report format (with two sample entries) is as follows:

| Plugin Name | Repository | Registry Version | Upstream Version | Error |
| ------ | ------ | ------ | ------ | ------ |
| gitlens | [https://github.com/eamodio/vscode-gitlens](https://github.com/eamodio/vscode-gitlens) | 10.2.1 | **10.2.2** | |
| asciidoctor-vscode | [https://github.com/asciidoctor/asciidoctor-vscode](https://github.com/asciidoctor/asciidoctor-vscode) | 2.7.7 | **2.7.16** | |


When the registry version of a plugin's VS Code extension is out of date, the far-right column "Upstream Version" entry is bolded. If an error occurred while checking the plugin, it will be reported in the "Error" column.