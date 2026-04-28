# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:22-alpine AS build

# Install native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy monorepo root files needed for npm workspace resolution
COPY package.json package-lock.json tsconfig.base.json ./

# Copy shared types (resolved by esbuild alias during build)
COPY shared/ ./shared/

# Copy both workspaces — esbuild is a transitive dep of client/vite
# and server/build.mjs imports it; npm hoists it to root node_modules
COPY server/package.json ./server/
COPY server/ ./server/
COPY client/package.json ./client/

# Install all dependencies (esbuild comes via client workspace hoisting)
RUN npm ci

# Build the server (esbuild → build/server/)
RUN npm run build -w server

# Prune dev dependencies — production stage inherits compiled better-sqlite3 .node binary
RUN npm prune --omit=dev

# ── Stage 2: Production ──────────────────────────────────────────
FROM node:22-alpine AS production

# su-exec allows runtime chown of volume-mounted data dir before privilege drop
RUN apk add --no-cache su-exec

WORKDIR /app/server

# Copy built artifacts from build stage
COPY --from=build /app/server/build/server/ ./build/server/

# Copy package metadata
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/server/package.json ./package.json

# Copy pre-compiled production node_modules (includes better-sqlite3 native addon)
COPY --from=build /app/node_modules/ /app/node_modules/

# Create data directory for SQLite
RUN mkdir -p data

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=./data/todo.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/healthz || exit 1

# Chown the volume-mounted data dir at runtime (handles pre-existing root-owned volumes),
# then drop to appuser via su-exec before starting the server
CMD ["sh", "-c", "chown -R appuser:appgroup /app/server/data && exec su-exec appuser node build/server/server.js"]
