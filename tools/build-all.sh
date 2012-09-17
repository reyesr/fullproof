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

