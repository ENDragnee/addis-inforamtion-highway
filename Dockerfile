# syntax=docker/dockerfile:1
# Use a specific, consistent version of Node.js
ARG NODE_VERSION=24.4.1

# ---- Base ----
# A common base stage to define the working directory and user
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies ----
# This stage is dedicated to installing production dependencies.
# It's a separate stage for better layer caching.
FROM base AS deps
# Add python/make/g++ for native dependencies, common in many npm packages.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
# Use 'npm ci' for clean, reproducible installs from the lockfile.
RUN npm ci --omit=dev

# ---- Builder ----
# This stage builds the Next.js application.
FROM base AS builder
# Add build-time dependencies
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
# Install ALL dependencies, including devDependencies needed for building.
RUN npm ci
# Copy the rest of the application source code
COPY . .
# Generate Prisma Client so it's available during the build process
RUN npx prisma generate
# Build the Next.js application. This will now use the `output: 'standalone'`
# configuration from next.config.mjs.
RUN npm run build

# ---- Runner (Final Production Image) ----
# This is the final, minimal image that will run in production.
FROM base AS final
WORKDIR /usr/src/app
ENV NODE_ENV=production
# Run as a non-root user for better security.
USER node

# Copy the standalone output from the builder stage.
# This includes the server.js, a minimal node_modules, and necessary .next files.
COPY --from=builder --chown=node:node /usr/src/app/.next/standalone ./

# Copy the public and static assets.
COPY --from=builder --chown=node:node /usr/src/app/public ./public
COPY --from=builder --chown=node:node /usr/src/app/.next/static ./.next/static

# Expose the port Next.js runs on.
EXPOSE 3000

# The standalone output creates a 'server.js' file.
# Running this directly is more efficient than going through 'npm start'.
CMD ["node", "server.js"]
