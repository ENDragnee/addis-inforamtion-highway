# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.4.1

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app

################################################################################
# Deps Stage: Install production dependencies
FROM base AS deps
RUN apk add --no-cache --virtual .fetch-deps python3 make g++
COPY package.json package-lock.json ./

# Re‑sync the lockfile to package.json
RUN npm install --package-lock-only

# Now ci will work
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

RUN apk del .fetch-deps

################################################################################
# Build Stage: Build the application (with dev deps)
FROM base AS build
RUN apk add --no-cache --virtual .build-deps python3 make g++
COPY package.json package-lock.json ./

# Re‑sync lock here too (so dev deps install cleanly)
RUN npm install --package-lock-only

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
RUN apk del .build-deps

################################################################################
# Final Stage: Run the application
FROM node:${NODE_VERSION}-alpine AS final
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3000
CMD ["npm", "start"]
