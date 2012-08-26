#!/bin/bash
#
# This script uses the Closure Compiler to minify the javascript and make distributions of fullproof
#
# OFFLINE USAGE: Call the script with the CLOSURE_COMPILER_JAR variable set
# ~/fullproof/tools $ CLOSURE_COMPILER_JAR=closure-compiler/compiler.jar ./build.sh
#
# ONLINE USAGE: Just call the script with no parameter. It then uses the http://closure-compiler.appspot.com/compile
# url to make a call to the web service.
#
# To customize your distribution, just add a new distribution with your own files.
#
ROOT=`dirname "$0"`/..
ROOT=`readlink -e "$ROOT"`

BUILD="$ROOT"/build

BASE="$ROOT/src/*.js  $ROOT/src/stores/*.js"
UNICODE="$ROOT/src/unicode/categ_letters_numbers.js $ROOT/src/unicode/normalizer_lowercase_nomark.js $ROOT/src/unicode/unicode.js"
ENGLISH=$ROOT/src/normalizers/english/*.js
FRENCH=$ROOT/src/normalizers/french/*.js

mkdir -p "$BUILD"

#
# $1 is the name to create
# $2 is the list of files to compile
build_version_offline () 
{
	TARGET="$1"
	shift

	local JSOPT=
	while (( "$#" )); do
		JSOPT="$JSOPT --js $1"
		shift
	done
	echo Building version $TARGET
	java -jar "$CLOSURE_COMPILER_JAR" $JSOPT --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file $TARGET
}

build_version_online () 
{
	TARGET="$1"
	shift
	local TEMPFILE=`mktemp`
	local JSOPT=
	while (( "$#" )); do
		JSOPT="$JSOPT --js $1"
		cat "$1" >>"$TEMPFILE"
		shift
	done
	echo Calling online closure API and saving to $TARGET
	curl -s -d output_format=text -d output_info=compiled_code --data-urlencode "js_code@${TEMPFILE}" \
		-d compilation_level=SIMPLE_OPTIMIZATIONS  \
		 http://closure-compiler.appspot.com/compile >$TARGET
	rm -f "$TEMPFILE"
}


BUILDER=build_version_online
if [[ "$CLOSURE_COMPILER_JAR" != "" ]] ; then
	BUILDER=build_version_offline
fi

"$BUILDER" "$BUILD"/fullproof-english.js $BASE $UNICODE $ENGLISH
"$BUILDER" "$BUILD"/fullproof-french.js $BASE $UNICODE $FRENCH
"$BUILDER" "$BUILD"/fullproof-all.js $BASE $UNICODE $ENGLISH $FRENCH

ls -la "$BUILD"

