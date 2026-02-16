# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update -y && \
  apt-get install -y --no-install-recommends openssl ca-certificates && \
  rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app

FROM base AS deps
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile --prod=false

FROM deps AS builder
ENV NODE_ENV=development
COPY tsconfig.json prisma.config.ts biome.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm prisma:generate
RUN pnpm build

FROM builder AS prod-deps
ENV NODE_ENV=production
RUN pnpm prune --prod

FROM deps AS development
COPY . .
ENV NODE_ENV=development
ENV APP_HOST=0.0.0.0
EXPOSE 3001
CMD ["pnpm", "dev"]

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
ENV APP_HOST=0.0.0.0
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && \
  chown -R node:node /app
USER node
EXPOSE 3001
CMD ["./docker-entrypoint.sh"]
