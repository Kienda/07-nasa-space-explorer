#!/usr/bin/env bash
# Regenerate js/config.js from the NASA_API_KEY value in .env.
#
# .env is gitignored; js/config.js is committed because the browser needs the
# key at runtime. Run this after changing or rotating the key, then commit
# js/config.js and push to update the deployed site.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "error: .env not found. Create it with: NASA_API_KEY = your-key" >&2
  exit 1
fi

KEY=$(grep '^[[:space:]]*NASA_API_KEY' .env | head -1 | sed 's/[^=]*=//' | tr -d '[:space:]')

if [ -z "$KEY" ]; then
  echo "error: NASA_API_KEY is empty in .env" >&2
  exit 1
fi

cat > js/config.js <<EOF
// NASA API key for this static site.
//
// This value is intentionally committed. The page calls the NASA API directly
// from the browser, so the key is visible to anyone viewing the deployed site
// no matter where it is stored. Use free, rate-limited keys only here - never
// a paid or privileged credential.
//
// To change it: update .env (gitignored), then run scripts/build-config.sh
window.NASA_API_KEY = '$KEY';
EOF

echo "wrote js/config.js (key length ${#KEY})"
