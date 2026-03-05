#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUST_DIR="$SCRIPT_DIR/../inheritance-rust-forward"
FRONTEND_WASM_DIR="$SCRIPT_DIR/../inheritance-frontend-forward/app/src/wasm/pkg"

echo "Building WASM package..."
cd "$RUST_DIR"
wasm-pack build --target web --out-dir pkg

echo "Copying pkg to frontend..."
rm -rf "$FRONTEND_WASM_DIR"
cp -r "$RUST_DIR/pkg" "$FRONTEND_WASM_DIR"

echo "Done. WASM package built and copied to frontend."
