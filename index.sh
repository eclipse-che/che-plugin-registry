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
    # 2. filter lines with name,version,type
    # 3. Replace ` :` with `":"`
    # 4. Append `",` to the end of each line
    # 5. Append `"` at the begining of each line
    # 6. Remove all new lines
    # 7. Remove last ','
    cat $i|grep -e name -e version -e type |   sed 's/: /\":"/g'  | sed 's/$/\",/g' | sed 's/^/\"/g'  | tr -d '\n' |  sed 's/,$//g'
    echo "}"
done
echo "]"
