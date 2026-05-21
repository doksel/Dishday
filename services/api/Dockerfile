# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace manifests for cached install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY services/api/package.json ./services/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# Install all deps (workspace-aware)
RUN pnpm install --frozen-lockfile

# Copy sources
COPY services/api ./services/api
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils

# Generate Prisma client + build TS
RUN pnpm --filter @dishday/api db:generate
RUN pnpm --filter @dishday/api build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/services/api/package.json ./services/api/
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/prisma ./services/api/prisma
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/utils ./packages/utils
# Prisma client lives in node_modules/.prisma after generate; preserve it
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 4000
WORKDIR /app/services/api
CMD ["node", "dist/index.js"]
