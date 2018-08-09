# Eclipse Che plugin registry

## Build Eclipse Che plugin registry docker image

Execute
```shell
docker build --no-cache -t eclipse/che-plugin-marketplace .
```
Where `--no-cache` is needed to prevent usage of cached layers with plugin registry files.
Useful when you change plugin metadata files and rebuild the image.

## https://hub.docker.com/

```eclipse/che-plugin-marketplace:latest``` image would be rebuilt after each commit in master

### License
Che is open sourced under the Eclipse Public License 2.0.
