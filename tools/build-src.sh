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

test -f common.sh || {
    echo "The `basename $0` script must be invoked in the tools directory." >&2
    exit 1
}

. common.sh

BUILD="$BUILD"/js
BASE="$ROOT/src/*.js  $ROOT/src/stores/*.js $ROOT/src/misc/*.js"
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

    echo >/tmp/all.js
	local JSOPT=
	while (( "$#" )); do
		JSOPT="$JSOPT --js $1"
		cat <"$1" >>/tmp/all.js
		shift
	done
	echo Building version $TARGET
	java -jar "$CLOSURE_COMPILER_JAR" $JSOPT --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file $TARGET
	## java -jar "$CLOSURE_COMPILER_JAR" $JSOPT --compilation_level WHITESPACE_ONLY --js_output_file $TARGET
	## cp /tmp/all.js "$TARGET"
}

build_version_online () 
{
	TARGET="$1"
	shift
	local TEMPFILE=`mktemp $MKTEMP_ARGS`
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

cat $BASE $UNICODE $ENGLISH $FRENCH >"$BUILD"/fullproof-all-debug.js

ls -la "$BUILD"

if [[ "$JSDOC" != "" ]] ; then
	echo "now building documentation"
	DOC="$BUILD/docs"
	mkdir -p "$DOC"
	"$JSDOC" -d="$DOC" $BASE $ENGLISH $FRENCH
fi

