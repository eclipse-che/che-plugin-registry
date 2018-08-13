#!/bin/sh

## search for all editors and plugins
declare -a arr=(`find . -name "meta.yaml"`)
FIRST_LINE=true
echo "["
## now loop through meta files
for i in "${arr[@]}"
do
    IFS='/' segments=($i)
    if [ "$FIRST_LINE" = true ] ; then
        echo \{\"name\":\"${segments[2]}\",\"version\":\"${segments[3]}\"\}
        FIRST_LINE=false
    else
        echo \,\{\"name\":\"${segments[2]}\",\"version\":\"${segments[3]}\"\}
    fi
done
echo "]"
