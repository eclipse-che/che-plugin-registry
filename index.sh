#!/bin/sh

## search for all editors and plugins
declare -a arr=(`find . -name "meta.yaml"`)
FIRST_LINE=true
echo "["
## now loop through meta files
for i in "${arr[@]}"
do
    if [ "$FIRST_LINE" = true ] ; then
        echo "{"
        FIRST_LINE=false
    else
        echo ",{"
    fi

    # 1. read meta.yaml to stio
    cat $i| \
        # 2. filter lines with name,version,type
        grep -e 'name:' -e 'version:' -e 'type:' -e 'id:' -e 'description' |\
        # 3. Replace ` :` with `":"`
        sed 's/: /\":"/g'  |\
        # 4. Append `",` to the end of each line
        sed 's/$/\",/g' |\
        # 5. Append `"` at the beginning of each line
        sed 's/^/\"/g'  |\
        # 6. Remove all new lines
        tr -d '\n'
    echo " \"links\": {\"self\":\"$(echo $i|sed 's/^.//g' )\" }"
    echo "}"
done
echo "]"
