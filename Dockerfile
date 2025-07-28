# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.11.1

################################################################################
# Base Stage
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

################################################################################
# Deps Stage: Install production dependencies
FROM base as deps
# <<< OPTIMIZATION: Copy only package files first
COPY package.json package-lock.json ./
# <<< FIX: Use the fast and strict npm ci
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Build Stage: Build the application
FROM base as build
# <<< OPTIMIZATION: Copy only package files first
COPY package.json package-lock.json ./
# <<< FIX: Use the fast and strict npm ci
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# <<< OPTIMIZATION: Now copy the rest of the code
# The .dockerignore file will prevent node_modules, .git, etc., from being copied.
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

################################################################################
# Final Stage: Run the application
FROM base as final

ENV NODE_ENV production
USER node

# <<< FIX: Copy package.json to the root, not a subdirectory named "install"
COPY --from=build /usr/src/app/package.json .

# Copy production dependencies and built application from previous stages
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public

# Copy the generated Prisma client needed at runtime
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
# The schema isn't strictly needed at runtime but is good practice to include
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3000

# <<< FIX: The final command for a production container MUST be 'npm start'
CMD ["npm", "start"]
