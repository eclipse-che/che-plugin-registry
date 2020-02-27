# Tools

This directory contains a set of tools to facilitate certain tasks that a Che developer may encounter.

## Plugin Updates

All Che plugins depend on VS Code extensions, and these are usually hosted on other repositories. Sometimes these extensions can be out of date,
as a newer version of the extension has been released upstream. In order to maintain the Che Plugin Registry and keep it up to date, a script
has been provided which can check for updates, report which plugins need updating, and automatically file issues for those plugins that do
need updating.

Installation: create a virtual environment with the following Python packages installed

```
certifi==2019.11.28
chardet==3.0.4
idna==2.9
packaging==20.1
pyparsing==2.4.6
PyYAML==5.3
requests==2.23.0
six==1.14.0
urllib3==1.25.8
```

Alternatively, there also is a Dockerfile which will build a container in which you can run the script. All you need to do is export your GitHub
token via the ```GITHUB_TOKEN``` environment variable.

Open the script and fill in your GitHub token, repository name, repository owner, and any labels you want to be attached to the issues the
script files.

```
Usage: ./plugin_checker.py [OPTIONS]
Options:
    --help
        Print this message.
    --file, -f
        File an issue for every plugin that is out of date
    --silent, -s
        Suppress the summary report that would otherwise be printed when the script finishes running
```
