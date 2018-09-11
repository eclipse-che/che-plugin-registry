# Eclipse Che plugin registry

## Build Eclipse Che plugin registry docker image

Execute
```shell
docker build --no-cache -t eclipse/che-plugin-registry .
```
Where `--no-cache` is needed to prevent usage of cached layers with plugin registry files.
Useful when you change plugin metadata files and rebuild the image.

## https://hub.docker.com/

```eclipse/che-plugin-registry:latest``` image would be rebuilt after each commit in master

## OpenShift
You can deploy Che plugin registry on Openshift with command.
```
  oc new-app -f openshift/che-plugin-registry.yml \
             -p IMAGE="eclipse/che-plugin-registry" \
             -p IMAGE_TAG="latest" \
             -p PULL_POLICY="IfNotPresent"
```
## Docker
```
docker run -it  --rm  -p 8080:8080 eclipse/che-plugin-registry
```

## Get index list of all plugins
Example:
```
curl  "http://localhost:8080/index.json"
```
Response:
```javascript
[
  {
    "id": "org.eclipse.che.editor.theia",
    "version": "1.0.0",
    "type": "Che Editor",
    "name": "theia-ide",
    "description": "Eclipse Theia",
    "links": {
      "self": "/plugins/org.eclipse.che.editor.theia/1.0.0/meta.yaml"
    }
  },
  {
    "id": "che-service-plugin",
    "version": "0.0.1",
    "type": "Che Plugin",
    "name": "Che Service",
    "description": "Che Plug-in with Theia plug-in and container definition providing a service",
    "links": {
      "self": "/plugins/che-service-plugin/0.0.1/meta.yaml"
    }
  },
  {
    "id": "che-dummy-plugin",
    "version": "0.0.1",
    "type": "Che Plugin",
    "name": "Che dummy plugin",
    "description": "A hello world theia plug-in wrapped into a Che Plug-in",
    "links": {
      "self": "/plugins/che-dummy-plugin/0.0.1/meta.yaml"
    }
  }
]
```
## Get meta.yaml of a plugin
Example:
```
curl  "http://localhost:8080/plugins/org.eclipse.che.editor.theia/1.0.0/meta.yaml"
```
Response:
```yaml
id: org.eclipse.che.editor.theia
version: 1.0.0
type: Che Editor
name: theia-ide
title: Eclipse Theia for Eclipse Che
description: Eclipse Theia
icon: https://pbs.twimg.com/profile_images/929088242456190976/xjkS2L-0_400x400.jpg
url: https://github.com/ws-skeleton/che-editor-theia/releases/download/untagged-892e01b21d0145207b0f/che-editor-plugin.tar.gz
```

### License
Che is open sourced under the Eclipse Public License 2.0.
