# syntax=docker/dockerfile:1.7
#
# Multi-stage build for Chi.
# - deps:    install full dependencies for build
# - build:   nuxt build
# - runtime: minimal Node 24 image to run Nitro server

ARG NODE_VERSION=24-alpine

# ─── deps ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.13.0 --activate

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# ─── build ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.13.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# ─── runtime ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

RUN addgroup -S chi && adduser -S chi -G chi

# Copy compiled Nitro output
COPY --from=build --chown=chi:chi /app/.output ./.output
# Copy migrations so migration runner or scripts can run if needed
COPY --from=build --chown=chi:chi /app/drizzle ./drizzle

USER chi
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
