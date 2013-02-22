#!/bin/bash

test -f common.sh || {
    echo "The `basename $0` script must be invoked in the tools directory." >&2
    exit 1
}

. common.sh

TOOLS=.
TARGET="$BUILD"/site
SITEROOT="$ROOT"/docs/site

rm -fr "$TARGET"
mkdir -p "$TARGET"

set +e
which pandoc
case $? in
    0)
        for file in "$SITEROOT"/*.md
        do
            TARGETNAME=`basename "$file"`
            TARGETNAME=${TARGETNAME%%.md}.html
            pandoc -f markdown -t html5 -o "$TARGET"/"$TARGETNAME" -s --template="$SITEROOT"/template.html5 <"$file"
            RETVAL=$?
            [ $RETVAL == 0 ] && echo processed file `basename "$file"` to `readlink $READLINK_F_FLAG $TARGET/"$TARGETNAME"`
            [ $RETVAL != 0 ] && echo ERROR processing file "$file" to $TARGET
        done
    ;;

    *)
        echo pandoc is not available, skipping processing of .md files >&2
    ;;
esac
set -e

cp -r "$SITEROOT"/img "$TARGET"/
cp -r "$SITEROOT"/css "$TARGET"/

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
        # The dev2build-html.awk script is missing from this repo, so skip this
        # step for now. Also, the -v flag is invalid on Mac OS X.
        : awk -v link="$BUILD"/js/fullproof-all.js -f "$TOOLS"/dev2build-html.awk >"$2"/`basename "$file"` <"$file"
    done
}

test -d "$BUILD"/site/examples || mkdir -p "$BUILD"/site/examples
for example in colors mame animals
do
    process_example_dir "$ROOT"/examples/$example "$BUILD"/site/examples/$example
done
