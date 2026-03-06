# syntax=docker/dockerfile:1

# ---- Build WASM Engine ----
FROM node:20-alpine AS wasm-build

RUN apk add --no-cache curl build-base && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    . $HOME/.cargo/env && \
    rustup target add wasm32-unknown-unknown && \
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app

COPY engine/ ./engine/
RUN . $HOME/.cargo/env && \
    wasm-pack build engine --target web --out-dir frontend/src/wasm/pkg

# ---- Build Frontend ----
FROM node:20-alpine AS frontend-build

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN
ARG VITE_APP_VERSION

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_APP_VERSION=$VITE_APP_VERSION

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
COPY --from=wasm-build /app/frontend/src/wasm/pkg ./src/wasm/pkg

RUN npm run build

# ---- Serve Stage ----
FROM nginx:alpine

COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
