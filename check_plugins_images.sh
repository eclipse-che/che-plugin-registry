#!/bin/bash

## browse all plugin directories which names and
## check that icon tags in meta.yaml files points to the .svg images
cd plugins
for d in */ ; do
  ID_DIR_NAME=${d%/}
  cd $d

  for VERSION_DIR_NAME in */ ; do
    # Remove trailing slash
    VERSION_DIR_NAME=${VERSION_DIR_NAME%/}
    cd $VERSION_DIR_NAME

    ICON=$(yq r meta.yaml icon | sed 's/^"\(.*\)"$/\1/')
    # Regex: contains .svg and not contains dots after it (to avoid xxx.svg.jpg hacks)
    if [[ ! $ICON =~ (\.svg)+[^\.]*$ ]];then
      echo "!!!   Wrong icon type found in '${ID_DIR_NAME}/${VERSION_DIR_NAME}':"
      echo "!!!   '${ICON}' Make sure it is pointing to .svg image."
      FOUND=true
    fi
    cd ..
  done

  cd ..
done

if [[ $FOUND ]];then
  exit 1
fi