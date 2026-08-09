# Dockerfile for the LANStream Host (Node.js/Vite).
# Lightweight image for LAN media streaming.

# -- Stage 1: Dependencies --
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/host/package.json ./apps/host/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile || pnpm install

# -- Stage 2: Build --
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/host/node_modules ./apps/host/node_modules
COPY . .
WORKDIR /app/apps/host
RUN pnpm run build

# -- Stage 3: Production --
FROM node:20-alpine AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hostapp

WORKDIR /app

# Copy built output
COPY --from=builder /app/apps/host/dist ./dist
COPY --from=builder /app/apps/host/package.json ./

USER hostapp

EXPOSE 4780
CMD ["node", "dist/main.js"]
