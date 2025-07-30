
---

# Addis Information Highway

### A Foundational Protocol for Ethiopia's Digital Future

This project is the reference implementation for a national trust protocol designed to create a secure, efficient, and citizen-sovereign digital economy for Ethiopia. It transforms the National ID (Fayda) into the master key for all digital interactions.

***

## Table of Contents

-   [Introduction: The Vision](#introduction-the-vision)
    -   [The Core Problem](#the-core-problem)
    -   [The Solution](#the-solution)
    -   [Guiding Principles](#the-guiding-principles)
    -   [Architecture](#the-architecture)
    -   [The Grand Scale](#the-grand-scale)
-   [Members](#members)
-   [Getting Started & Setup](#getting-started--setup)
    -   [Method 1: Running Locally with npm](#method-1-running-locally-with-npm)
    -   [Method 2: Running with Docker (Recommended)](#method-2-running-with-docker-recommended-for-isolated-environments)
-   [Technology Stack](#technology-stack)

---

## Introduction: The Vision

For generations, our society and economy have been built on a foundation of paper, physical presence, and institutional hierarchies. To get a loan, to enroll in a university, to start a business—every significant action requires a citizen to physically present themselves to an institution and prove who they are, over and over again. This project proposes a Great Inversion of this dynamic.

We are building the foundational infrastructure to create a new reality, one built on a simple yet revolutionary principle: **Your identity, and the data associated with it, is an asset that you control.**

This protocol transforms Ethiopia's National ID (Fayda) from a simple identification card into the master key for the entire digital economy. It creates a future where trust is not a slow, expensive, and manual process, but an instant, secure, and automated utility. This is the bedrock upon which a more efficient, equitable, and innovative Ethiopia will be built.

### The Core Problem

#### Economics: The End of the "Trust Tax"
Every modern economy is burdened by an invisible, crushing tax: the "trust tax." This is the massive cost we all pay for the friction of proving things. By making trust nearly free and instantaneous, we eliminate this tax, unleashing trillions of Birr in trapped value and productivity.

#### Security: The Distributed Immune System
The old model creates "honeypots." By centralizing sensitive data, we create irresistible targets. Our model follows the logic of a biological immune system. It is decentralized. The system becomes resilient because there is no central brain to attack. We are not building a digital fortress; we are cultivating a national digital immune system.

### The Solution: A Secure Diplomatic Courier Service

Our company provides the **courier service itself**. We are the trusted transport layer. We never open the mail; we just guarantee it gets to the right person, from the right source, with the owner's full permission.

1.  **The Request:** A bank requests 'Verified Salary Information' from 'Ethio Telecom' for 'Abebe Bikila'.
2.  **The Permission:** Abebe gets a notification on his phone and provides cryptographic approval.
3.  **The Delivery:** Ethio Telecom generates a tamper-proof, digitally signed "pouch" (a Verifiable Credential) and our protocol facilitates its direct, secure delivery to the bank.

### The Guiding Principles: The Constitution of the Protocol

1.  **Federated Data Sovereignty:** Data stays at the source.
2.  **Zero-Trust Network:** Assume hostility until proven otherwise.
3.  **Explicit User Consent:** The citizen is the platform.
4.  **Interoperability via Open Standards:** No vendor lock-in.
5.  **Asynchronous & Resilient by Design:** Failures are handled gracefully.
6.  **Immutable Auditability:** An unimpeachable record of truth.

*(For the full vision, check out our Project Vision and Objective page in the wiki tab...)*

---

## Members

-   Mastwal Mesfin ([ENDragnee](https://github.com/ENDragnee))
-   Kidus Goshu ([kidusgoshu](https://github.com/kidusgoshu))
-   Yeabsira Fikadu ([DeepBlue-dot](https://github.com/DeepBlue-dot))

---

## Getting Started & Setup

You can set up this project in one of two ways. Docker Compose is recommended for a consistent, isolated environment that "just works".

### Default Super user email and password
-   **Email:** `superuser@test.com`
-   **Password:** `qazwsxedc`

### Prerequisites

-   **Git:** To clone the repository.
-   **Node.js:** v20.x or higher (for the npm method).
-   **Docker & Docker Compose:** Required for Method 2, and recommended for the database in Method 1.

### Method 1: Running Locally with npm (Bare Metal Setup)

This method requires you to run the Node.js application directly on your machine.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ENDragnee/addis-inforamtion-highway.git
    cd addis-inforamtion-highway
    ```

2.  **Checkout the Desired Branch**
    -   For the latest stable release: `git switch main`
    -   For new features and development: `git switch dev`

3.  **Create Environment File**
    Create a file named `.env.local` in the project root and add the following:

    ```dotenv
    # .env.local

    # -- Database --
    # This URL points to a database running on your local machine (or in a Docker container).
    DATABASE_URL="postgresql://user:password@localhost:5432/addis-information-highway?schema=public"

    # -- E-Signet OAuth Configuration --
    CLIENT_ID=crXYIYg2cJiNTaw5t-peoPzCRo-3JATNfBd5A86U8t0
    REDIRECT_URI=http://localhost:3000/callback
    AUTHORIZATION_ENDPOINT=https://esignet.ida.fayda.et/authorize
    TOKEN_ENDPOINT=https://esignet.ida.fayda.et/v1/esignet/oauth/v2/token
    USERINFO_ENDPOINT=https://esignet.ida.fayda.et/v1/esignet/oidc/userinfo

    # -- JWT Signing Configuration --
    EXPIRATION_TIME=15
    ALGORITHM=RS256
    CLIENT_ASSERTION_TYPE=urn:ietf:params:oauth:client-assertion-type:jwt-bearer

    # -- NextAuth.js Configuration --
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="xbjsa7wFVPPKbx1FAAQakxRJ+XSYRxGXHKflK3f9NvI=" # Replace with a new secret in production
    ```

4.  **Set Up the PostgreSQL Database**
    You need a running PostgreSQL instance. You have two options:

    -   **Option A: Use Your Own PostgreSQL Installation**
        If you have PostgreSQL installed locally, ensure you have a database named `addis-information-highway` and a user/password that matches the `DATABASE_URL`.

    -   **Option B: Use Docker for the Database (Easy)**
        If you have Docker but don't want to install PostgreSQL locally, you can start just the database service from our `compose.dev.yaml` file. This is a clean and simple way to get a database running.
        ```bash
        docker-compose -f compose.dev.yaml up -d db
        ```
        This command starts a PostgreSQL container in the background with the correct user, password, and database name.

5.  **Install Dependencies**
    ```bash
    npm install
    ```

6.  **Run Database Migrations**
    This command connects to your database and creates the necessary tables.
    ```bash
    npx prisma migrate dev
    ```

7.  **Generate Prisma Client**
    This updates the TypeScript types for your database models.
    ```bash
    npx prisma generate
    ```

8.  **Run the Application**
    -   For development mode with hot-reloading:
        ```bash
        npm run dev
        ```
    -   For a production build and test:
        ```bash
        npm run build
        npm run start
        ```

The application will now be available at [http://localhost:3000](http://localhost:3000).

---

### Method 2: Running with Docker Compose (Recommended)

This is the simplest way to get started. It creates isolated containers for both the Next.js app and the PostgreSQL database, managed by a single command.

#### The `Dockerfile`
Our project uses a modern, multi-stage `Dockerfile` to create a small, fast, and secure production image by leveraging Next.js's "standalone" output mode.

```dockerfile
# syntax=docker/dockerfile:1
# Use a specific, consistent version of Node.js
ARG NODE_VERSION=20.11.1

# ---- Base ----
# A common base stage to define the working directory and user
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies ----
# This stage is dedicated to installing production dependencies.
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Builder ----
# This stage builds the Next.js application.
FROM base AS builder
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runner (Final Production Image) ----
# This is the final, minimal image that will run in production.
FROM base AS final
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node

# Copy the standalone output from the builder stage.
COPY --from=builder --chown=node:node /usr/src/app/.next/standalone ./
# Copy the public and static assets.
COPY --from=builder --chown=node:node /usr/src/app/public ./public
COPY --from=builder --chown=node:node /usr/src/app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

#### Setup and Running with Docker Compose

1.  **Clone the Repository** (if you haven't already)
    ```bash
    git clone https://github.com/ENDragnee/addis-inforamtion-highway.git
    cd addis-inforamtion-highway
    ```

2.  **Create Environment File**
    Create a file named `.env` in the project root. **Note the filename is `.env`**. The `DATABASE_URL` is different here as it must point to the Docker service name (`db`).

    ```dotenv
    # .env

    # -- Database --
    # Connects to the 'db' service defined in the compose file.
    DATABASE_URL="postgresql://user:password@db:5432/addis-information-highway?schema=public"

    # -- E-Signet OAuth Configuration --
    CLIENT_ID=crXYIYg2cJiNTaw5t-peoPzCRo-3JATNfBd5A86U8t0
    REDIRECT_URI=http://localhost:3000/callback
    AUTHORIZATION_ENDPOINT=https://esignet.ida.fayda.et/authorize
    TOKEN_ENDPOINT=https://esignet.ida.fayda.et/v1/esignet/oauth/v2/token
    USERINFO_ENDPOINT=https://esignet.ida.fayda.et/v1/esignet/oidc/userinfo

    # -- JWT Signing Configuration --
    EXPIRATION_TIME=15
    ALGORITHM=RS256
    CLIENT_ASSERTION_TYPE=urn:ietf:params:oauth:client-assertion-type:jwt-bearer

    # -- NextAuth.js Configuration --
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="xbjsa7wFVPPKbx1FAAQakxRJ+XSYRxGXHKflK3f9NvI="
    ```

3.  **Run for Development**
    This command builds the images and starts the containers defined in `compose.dev.yaml`.

    ```bash
    docker-compose -f compose.dev.yaml up --build
    ```

    > **First-Time Setup:** Once the containers are running, you must apply the database migrations. Open a **new terminal window** and run this command:
    > ```bash
    > docker-compose -f compose.dev.yaml exec nextjs npx prisma migrate dev
    > ```

4.  **Stopping the Services**
    To stop the containers, press `Ctrl + C` in the terminal where they are running, or run `docker-compose -f compose.dev.yaml down` from another terminal.

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Technology Stack

-   **Framework:** Next.js (App Router)
-   **Styling:** Tailwind CSS with Shadcn UI
-   **Database:** PostgreSQL
-   **ORM:** Prisma
-   **Authentication:** NextAuth.js
-   **Deployment:** Docker
