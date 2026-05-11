#!/bin/bash
set -e

# Ensure node_modules/.bin is in PATH (for when script runs directly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$SCRIPT_DIR/../node_modules/.bin:$PATH"

source "$SCRIPT_DIR/dev-home.sh"
configure_dev_paseo_home

# Share speech models with the main install to avoid duplicate downloads
if [ -z "${PASEO_LOCAL_MODELS_DIR}" ]; then
  export PASEO_LOCAL_MODELS_DIR="$HOME/.paseo/models/local-speech"
  mkdir -p "$PASEO_LOCAL_MODELS_DIR"
fi

echo "══════════════════════════════════════════════════════"
echo "  Paseo Dev"
echo "══════════════════════════════════════════════════════"
echo "  Home:    ${PASEO_HOME}"
echo "  Models:  ${PASEO_LOCAL_MODELS_DIR}"
echo "══════════════════════════════════════════════════════"

# Allow any origin in dev so local desktop clients and tooling can connect.
# SECURITY: wildcard CORS is unsafe in production; this script is only for local daemon work.
export PASEO_CORS_ORIGINS="*"

exec ./scripts/dev-daemon.sh
