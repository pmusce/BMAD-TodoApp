# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copy monorepo root files needed for npm workspace resolution
COPY package.json package-lock.json tsconfig.base.json ./

# Copy shared types (resolved by Vite alias during build)
COPY shared/ ./shared/

# Copy client workspace
COPY client/package.json ./client/
COPY client/ ./client/

# Install dependencies
RUN npm ci --workspace=client

# Build-time variable: API URL baked into the client bundle
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Build the client (Vite → client/dist/)
RUN npm run build -w client

# ── Stage 2: Production (nginx) ──────────────────────────────────
FROM nginx:stable-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for SPA routing
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA from build stage
COPY --from=build /app/client/dist/ /usr/share/nginx/html/

# Configure nginx to run as non-root
RUN sed -i 's|pid\s*/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf && \
    grep -q 'pid /tmp/nginx.pid' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
