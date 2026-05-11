#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
UPSTREAM_SOURCE="$PROJECT_ROOT/upstream/paseo-0.1.64/paseo-0.1.64"
STAGE_ROOT="$PROJECT_ROOT/.bundled-upstream/paseo-0.1.64/paseo-0.1.64"

copy_tree() {
  src="$1"
  dest="$2"
  mkdir -p "$(dirname "$dest")"
  rm -rf "$dest"
  ditto "$src" "$dest"
}

copy_dep() {
  dep="$1"
  src="$UPSTREAM_SOURCE/node_modules/$dep"
  dest="$STAGE_ROOT/node_modules/$dep"
  if [ ! -e "$src" ]; then
    echo "Missing upstream dependency: $src" >&2
    exit 1
  fi
  copy_tree "$src" "$dest"
}

copy_runtime_dependency_closure() {
  dependency_paths=$(
    cd "$UPSTREAM_SOURCE" && \
      npm ls --omit=dev --all --parseable \
        --workspace=@getpaseo/server \
        --workspace=@getpaseo/cli \
        --workspace=@getpaseo/relay \
        --workspace=@getpaseo/highlight 2>/dev/null || true
  )

  printf '%s\n' "$dependency_paths" | while IFS= read -r absolute_path; do
    if [ -z "$absolute_path" ] || [ "$absolute_path" = "$UPSTREAM_SOURCE" ]; then
      continue
    fi

    relative_path=${absolute_path#"$UPSTREAM_SOURCE"/}
    case "$relative_path" in
      packages/cli|packages/cli/*|packages/server|packages/server/*|packages/relay|packages/relay/*|packages/highlight|packages/highlight/*)
        continue
        ;;
      node_modules/@getpaseo|node_modules/@getpaseo/*)
        continue
        ;;
    esac

    copy_tree "$absolute_path" "$STAGE_ROOT/$relative_path"
  done
}

if [ ! -d "$UPSTREAM_SOURCE" ]; then
  echo "Upstream source is missing at $UPSTREAM_SOURCE" >&2
  exit 1
fi

rm -rf "$PROJECT_ROOT/.bundled-upstream"
mkdir -p "$STAGE_ROOT/packages" "$STAGE_ROOT/node_modules/@getpaseo"

copy_tree "$UPSTREAM_SOURCE/package.json" "$STAGE_ROOT/package.json"
copy_tree "$UPSTREAM_SOURCE/packages/cli" "$STAGE_ROOT/packages/cli"
copy_tree "$UPSTREAM_SOURCE/packages/server" "$STAGE_ROOT/packages/server"
copy_tree "$UPSTREAM_SOURCE/packages/relay" "$STAGE_ROOT/packages/relay"
copy_tree "$UPSTREAM_SOURCE/packages/highlight" "$STAGE_ROOT/packages/highlight"

copy_tree "$STAGE_ROOT/packages/cli" "$STAGE_ROOT/node_modules/@getpaseo/cli"
copy_tree "$STAGE_ROOT/packages/server" "$STAGE_ROOT/node_modules/@getpaseo/server"
copy_tree "$STAGE_ROOT/packages/relay" "$STAGE_ROOT/node_modules/@getpaseo/relay"
copy_tree "$STAGE_ROOT/packages/highlight" "$STAGE_ROOT/node_modules/@getpaseo/highlight"

copy_runtime_dependency_closure

echo "Prepared bundled upstream runtime at $STAGE_ROOT"
