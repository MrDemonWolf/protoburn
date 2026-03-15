# =============================================================================
# ProtoBurn — Multi-stage Docker build
# =============================================================================

# --- Stage 1: Builder --------------------------------------------------------
FROM oven/bun:1 AS builder

WORKDIR /app

# Install Node.js (needed for Next.js build)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first for layer caching
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/api/package.json packages/api/
COPY packages/config/tsconfig.base.json packages/config/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/infra/package.json packages/infra/
COPY packages/pricing/package.json packages/pricing/

RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build web (static export)
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:8080
ARG NEXT_PUBLIC_API_PLAN=Max
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_API_PLAN=${NEXT_PUBLIC_API_PLAN}

RUN bun run --cwd apps/web build

# --- Stage 2: Server ---------------------------------------------------------
FROM oven/bun:1-alpine AS server

WORKDIR /app

# Copy full monorepo structure (needed for workspace resolution)
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/protoburn.db
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "apps/server/src/node.ts"]

# --- Stage 3: Web (nginx) ----------------------------------------------------
FROM nginx:alpine AS web

COPY --from=builder /app/apps/web/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:8080/ || exit 1
