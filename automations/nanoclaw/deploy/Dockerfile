# NanoClaw on Fly.io with Docker-in-Docker
FROM docker:27-dind

# Install Node.js 22 and tools
RUN apk add --no-cache nodejs npm git bash openssh-client

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create app directory
WORKDIR /app/nanoclaw

# Copy package files first for caching
COPY package*.json ./
RUN npm install --production

# Copy source and build
COPY . .
RUN npm run build

# Copy entrypoint
COPY deploy/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

VOLUME /data

ENTRYPOINT ["/app/entrypoint.sh"]
