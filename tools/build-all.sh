#!/bin/bash

ROOT=`dirname "$0"`/..
ROOT=`readlink -e "$ROOT"`
BUILD="$ROOT"/build

rm -fr "$BUILD"
mkdir -p "$BUILD"

./build-src.sh
./build-site.sh

shopt -s globstar

if [[ "$JSDOC" == "" ]] ; then
    JSDOC=`which jsdoc`
fi

if [[ "$JSDOC" != "" ]] ; then
	echo "now building documentation"
	DOC="$BUILD/site/jsdocs"
	mkdir -p "$DOC"
	"$JSDOC" -d="$DOC" "$ROOT"/**/*.js
else
    echo '[WARNING] jsdoc is not available, skipping' >&2
fi

RELEASENAME=fullproof-`date +%Y%m%d`
RELEASEDIR="$BUILD"/"$RELEASENAME"
mkdir -p  "$RELEASEDIR"
cp -r "$BUILD"/js/ "$RELEASEDIR"/
cp -r "$BUILD"/site/jsdocs "$RELEASEDIR"/
cp -r "$BUILD"/site/jsdocs "$RELEASEDIR"/
cp "$ROOT"/README.md "$RELEASEDIR"/
cp "$ROOT"/LICENSE "$RELEASEDIR"/
cp -r "$BUILD"/site/examples "$RELEASEDIR"

ORGDIR=`pwd`
cd "$BUILD"
zip -r "$RELEASENAME".zip "$RELEASENAME"
tar cvf "$RELEASENAME".tar "$RELEASENAME"
gzip "$RELEASENAME".tar
