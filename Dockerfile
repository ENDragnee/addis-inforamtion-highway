# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.4.1

################################################################################
# Base Stage
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app

################################################################################
# Deps Stage: Install production dependencies
FROM base AS deps
# << OPTIMIZATION: cache npm downloads
RUN apk add --no-cache --virtual .fetch-deps \
      python3 \
      make \
      g++ && \
    rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
# Remove build tools immediately to keep this layer small
RUN apk del .fetch-deps

################################################################################
# Build Stage: Build the application (with dev deps)
FROM base AS build
# Install build toolchain for native modules
RUN apk add --no-cache --virtual .build-deps \
      python3 \
      make \
      g++ && \
    rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
# Install all deps (including dev)
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source and generate Prisma client, then build
COPY . .
RUN npx prisma generate
RUN npm run build

# Clean up build toolchain
RUN apk del .build-deps

################################################################################
# Final Stage: Run the application
FROM node:${NODE_VERSION}-alpine AS final
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node

# Copy only production deps and built assets
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3000
CMD ["npm", "start"]
