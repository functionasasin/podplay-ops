#!/bin/bash
set -e

echo "=== OpenClaw Bot Starting ==="

# Clone or pull the monorepo
if [ -d "/app/monorepo/.git" ]; then
  echo "Monorepo exists, pulling latest..."
  cd /app/monorepo && git pull origin main
else
  echo "Cloning monorepo..."
  # Volume mount creates a non-empty dir (lost+found), so clone to temp and move
  git clone "$GIT_REPO_URL" /tmp/monorepo-clone
  cp -a /tmp/monorepo-clone/. /app/monorepo/
  rm -rf /tmp/monorepo-clone
fi

cd /app

# Initialize OpenClaw config if not already present
OPENCLAW_DIR="${OPENCLAW_STATE_DIR:-/root/.openclaw}"
mkdir -p "$OPENCLAW_DIR"

# Always write config (entrypoint is the source of truth)
echo "Writing OpenClaw config..."
cat > "$OPENCLAW_DIR/openclaw.json" << 'OCEOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6"
      },
      "workspace": "/app/monorepo",
      "maxConcurrent": 2
    },
    "list": [{"id": "main", "default": true}]
  },
  "auth": {
    "profiles": {
      "anthropic:default": {"mode": "token", "provider": "anthropic"}
    }
  },
  "bindings": [
    {"agentId": "main", "match": {"channel": "telegram"}}
  ],
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "allowlist",
      "allowFrom": ["1405224455"],
      "groups": {"*": {"requireMention": true}}
    }
  },
  "gateway": {"mode": "local", "bind": "auto"}
}
OCEOF
echo "Config written to $OPENCLAW_DIR/openclaw.json"

# Start the gateway (foreground — Fly.io expects a long-running process)
echo "Starting OpenClaw gateway..."
exec openclaw gateway --port 3000 --bind lan
