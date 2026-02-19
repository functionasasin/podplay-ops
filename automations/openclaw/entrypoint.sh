#!/bin/bash
set -e

echo "=== OpenClaw Bot Starting ==="

# Clone or pull the monorepo
if [ -d "/app/monorepo/.git" ]; then
  echo "Monorepo exists, pulling latest..."
  cd /app/monorepo && git pull origin main
else
  echo "Cloning monorepo..."
  git clone "$GIT_REPO_URL" /app/monorepo
fi

cd /app

# Import gateway config
echo "Importing gateway config..."
openclaw config import /app/openclaw/gateway.yaml

# Install skills
echo "Installing skills..."
for skill_dir in /app/openclaw/skills/*/; do
  if [ -d "$skill_dir" ]; then
    skill_name=$(basename "$skill_dir")
    echo "  Installing skill: $skill_name"
    openclaw skill install "$skill_dir"
  fi
done

# Start the gateway (foreground — Fly.io expects a long-running process)
echo "Starting OpenClaw gateway..."
exec openclaw start --foreground
