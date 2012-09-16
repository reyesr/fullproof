#!/bin/bash

ORGDIR=`pwd`
THISSCRIPT=`readlink -f "$0"`
TOOLS=`dirname "$THISSCRIPT"`
ROOT=`readlink -f "$TOOLS"/..`
TARGET="$ROOT"/build/site
SITEROOT="$ROOT"/docs/site

rm -fr "$TARGET"
mkdir -p "$TARGET"

for file in "$SITEROOT"/*.md
do
    TARGETNAME=`basename "$file"`
    TARGETNAME=${TARGETNAME%%.md}.html
    pandoc -f markdown -t html5 -o "$TARGET"/"$TARGETNAME" -s --template="$SITEROOT"/template.html5 <"$file"
    RETVAL=$?
    [ $RETVAL == 0 ] && echo processed file `basename "$file"` to `readlink -f $TARGET/"$TARGETNAME"`
    [ $RETVAL != 0 ] && echo ERROR processing file "$file" to $TARGET
done

echo cp -r "$SITEROOT"/img "$TARGET"/
cp -r "$SITEROOT"/img "$TARGET"/

mkdir -p "$ROOT"/build/site/js
cp "$ROOT"/build/js/*.js "$ROOT"/build/site/js/


##
## Process examples
##

#
# ARG1: original dir
# ARG2: destination
process_example_dir () {
    cp -r "$1"/ "$2"/
    for file in "$1"/*.html
    do
        echo converting $file
        awk -v link=../../js/fullproof-all.js -f "$TOOLS"/dev2build-html.awk >"$2"/`basename "$file"` <"$file"
    done
}
mkdir -p "$ROOT"/build/site/examples
process_example_dir "$ROOT"/examples/colors "$ROOT"/build/site/examples/colors
process_example_dir "$ROOT"/examples/mame "$ROOT"/build/site/examples/mame
process_example_dir "$ROOT"/examples/animals "$ROOT"/build/site/examples/animals
