# OpenClaw Bot — Fly.io Deployment
# Always-on Telegram bot backed by the monorepo as persistent state

FROM node:20-slim

# Install git (needed for monorepo sync) and openssh (for git push)
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*

# Install OpenClaw
RUN curl -fsSL https://get.openclaw.ai | bash

# Configure git for bot commits
RUN git config --global user.name "monorepo-bot" && \
    git config --global user.email "bot@monorepo.local"

WORKDIR /app

# Clone the monorepo — the bot's persistent state
# At runtime, GIT_REPO_URL secret provides the clone URL with credentials
# e.g. https://x-access-token:<PAT>@github.com/user/monorepo.git
RUN mkdir -p /app/monorepo

# Copy OpenClaw config
COPY gateway.yaml /app/openclaw/gateway.yaml
COPY skills/ /app/openclaw/skills/

# Startup script handles: clone repo, import config, start gateway
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080

CMD ["/app/entrypoint.sh"]
