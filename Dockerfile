# ---- Base stage ------------------------------------------------------------
FROM node:20-alpine AS base

# deps minimal + dumb-init
RUN apk add --no-cache dumb-init

# user & group
RUN addgroup -S nodejs -g 1001 && adduser -S nuxtjs -u 1001

# workdir
WORKDIR /app

# enable corepack
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# ENV
ENV PNPM_HOME=/home/nuxtjs/.pnpm \
    TMPDIR=/home/nuxtjs/.tmp \
    PATH=/home/nuxtjs/.pnpm:$PATH

# folder prep
RUN mkdir -p /home/nuxtjs/.pnpm /home/nuxtjs/.tmp /home/nuxtjs/.pnpm-store /app \
 && chown -R nuxtjs:nodejs /home/nuxtjs /app

# ---- Dependencies stage ----------------------------------------------------
FROM base AS deps

# copy manifest
COPY --chown=nuxtjs:nodejs .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./

USER nuxtjs

# install deps
RUN --mount=type=cache,id=pnpm-store,target=/home/nuxtjs/.pnpm-store \
    pnpm install --frozen-lockfile

# ---- Development stage -----------------------------------------------------
FROM deps AS development

# copy source code
COPY --chown=nuxtjs:nodejs . .

# expose ports
EXPOSE 3000 24678

# default command for dev
CMD ["pnpm", "dev"]

# ---- Build stage -----------------------------------------------------------
FROM deps AS build

# copy source code
COPY --chown=nuxtjs:nodejs . .

# copy .env.development to .env for build
RUN cp .env.development .env 2>/dev/null || echo "No .env.development found, using existing .env"

# build
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# ---- Runtime stage ----------------------------------------------------------
FROM node:20-alpine AS runtime

RUN apk add --no-cache dumb-init wget

RUN addgroup -S nodejs -g 1001 && adduser -S nuxtjs -u 1001
WORKDIR /app

ENV NODE_ENV=production

# copy output
COPY --from=build --chown=nuxtjs:nodejs /app/.output ./.output

USER nuxtjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000
ENTRYPOINT ["dumb-init","--"]
CMD ["node",".output/server/index.mjs"]