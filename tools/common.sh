# Set ROOT and BUILD vars for use by the various build scripts in this
# directory.

case "`uname`" in
    Darwin)
        LINK=`readlink ..`
        case $? in
            0)
                ROOT="$LINK"
            ;;
            *)
                ROOT=..
            ;;
        esac
        set -e
        MKTEMP_ARGS='-t fullproof-XXXXXX'
        READLINK_F_FLAG=
        ;;
    *)
        set -e
        ROOT=`readlink -e ..`
        MKTEMP_ARGS=
        READLINK_F_FLAG=-f
    ;;
esac

# Check $ROOT isn't empty (that would cause us to try removing / in build-
# all.sh and maybe elsewhere).

test -n "$ROOT" || {
    echo "Failed to set ROOT to non-empty value." >&2
    exit 2
}

BUILD="$ROOT"/build
