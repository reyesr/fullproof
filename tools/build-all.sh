#!/bin/bash

test -f common.sh || {
    echo "The `basename $0` script must be invoked from the tools directory." >&2
    exit 1
}

. common.sh

rm -fr "$BUILD"
mkdir -p "$BUILD"

./build-src.sh
./build-site.sh

if [[ "$JSDOC" == "" ]] ; then
    set +e
    JSDOC=`which jsdoc`
    set -e
fi

if [[ "$JSDOC" != "" ]] ; then
	echo "now building documentation"
	DOC="$BUILD/site/jsdocs"
	mkdir -p "$DOC"
	"$JSDOC" -d="$DOC" "$ROOT"/*/*.js
else
    echo '[WARNING] jsdoc is not available, skipping' >&2
fi

RELEASENAME=fullproof-`date +%Y%m%d`
RELEASEDIR="$BUILD"/"$RELEASENAME"
mkdir -p  "$RELEASEDIR"
cp -r "$BUILD"/js/ "$RELEASEDIR"/
test -n "$JSDOCS" && cp -r "$BUILD"/site/jsdocs "$RELEASEDIR"/
cp "$ROOT"/README.md "$RELEASEDIR"/
cp "$ROOT"/LICENSE "$RELEASEDIR"/
cp -r "$BUILD"/site/examples "$RELEASEDIR"

cd "$BUILD"
zip -r "$RELEASENAME".zip "$RELEASENAME"
tar cvf "$RELEASENAME".tar "$RELEASENAME"
gzip "$RELEASENAME".tar
