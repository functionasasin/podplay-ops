#!/bin/bash
set -e

# Start Docker daemon in the background
dockerd &

# Wait for Docker daemon to be ready
echo "Waiting for Docker daemon..."
until docker info >/dev/null 2>&1; do
  sleep 1
done
echo "Docker daemon ready."

# Build agent container image if not already built
if ! docker image inspect nanoclaw-agent:latest >/dev/null 2>&1; then
  echo "Building agent container image..."
  docker build -t nanoclaw-agent:latest -f /app/nanoclaw/container/Dockerfile /app/nanoclaw/container/
  echo "Agent image built."
fi

# Set up persistent directories on the volume
mkdir -p /data/store /data/groups /data/monorepo

# Symlink NanoClaw data dirs to volume
ln -sfn /data/store /app/nanoclaw/store
ln -sfn /data/groups /app/nanoclaw/groups

# Clone or pull the monorepo
if [ ! -d /data/monorepo/.git ]; then
  echo "Cloning monorepo..."
  git clone "$GIT_REPO_URL" /data/monorepo
else
  echo "Pulling latest monorepo..."
  cd /data/monorepo && git pull --rebase || true
  cd /app/nanoclaw
fi

# Copy group CLAUDE.md if the monorepo group doesn't exist yet on the volume
if [ ! -f /data/groups/monorepo/CLAUDE.md ]; then
  mkdir -p /data/groups/monorepo/logs
  cp /app/nanoclaw/groups/monorepo/CLAUDE.md /data/groups/monorepo/CLAUDE.md
fi

# Start git-sync cron (pull every 15 minutes, push if changes)
(while true; do
  sleep 900
  cd /data/monorepo
  git pull --rebase 2>/dev/null || true
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git add -A
    git commit -m "bot: sync from nanoclaw" 2>/dev/null || true
    git push 2>/dev/null || true
  fi
  cd /app/nanoclaw
done) &

echo "Starting NanoClaw..."
cd /app/nanoclaw
exec node dist/index.js
