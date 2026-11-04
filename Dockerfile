# 1. Base stage with pnpm
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY apps/simulator/package.json ./apps/simulator/

RUN pnpm install --frozen-lockfile

# 3. Builder stage
FROM deps AS builder
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter @watchlight/db db:generate
RUN pnpm turbo run build

# 4. Runner: Web (Next.js Standalone ~130MB)
FROM node:22-alpine AS web
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/prisma /app/packages/db/prisma

USER nodejs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# 5. Runner: Worker
FROM node:22-alpine AS worker
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/apps/worker ./apps/worker
COPY --from=builder --chown=nodejs:nodejs /app/scripts/db-init.sh ./scripts/db-init.sh
USER nodejs
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "apps/worker/dist/healthcheck.js"]
CMD ["node", "apps/worker/dist/index.js"]

# 6. Runner: Simulator
FROM node:22-alpine AS simulator
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/apps/simulator ./apps/simulator
USER nodejs
CMD ["node", "apps/simulator/dist/index.js"]
