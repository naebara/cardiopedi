# `template-psql`

Standard starter for self-hosted `Next.js + PostgreSQL + Prisma + NextAuth` apps.

## Standard contract

Every app based on this template should keep the same production contract:

- `Dockerfile` for container-based deploys
- `output: "standalone"` in Next.js
- `/api/health` endpoint for health checks
- `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `NEXTAUTH_URL`
- optional `RUN_DB_MIGRATIONS=true` for single-instance deploys

## Getting started after cloning

### Prerequisites

- Node.js `22.x`
- Local PostgreSQL installed and running
- `psql` available in your `PATH`
- A local PostgreSQL role with enough permissions to create:
  - databases
  - users
  - extensions (`pg_trgm`, `unaccent`)

### Bootstrap the project

From a fresh clone, run:

```bash
npm run setup
```

This script will:

- ask for the new project name and update `package.json`
- create `.env` from `.env.example` if it does not exist
- generate `AUTH_SECRET`
- run `npm install`

### Create the local database

Run:

```bash
npm run db:setup
```

This script will prompt for local database values and then:

- create the local PostgreSQL user if needed
- create the local PostgreSQL database if needed
- enable `pg_trgm` and `unaccent`
- update `DATABASE_URL` in `.env`

Defaults used by the script:

```bash
DB user: app_user
DB password: app_password
DB name: myapp_local
```

### Generate Prisma client and apply migrations

After the database exists, run:

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### First login

Open [http://localhost:3000/signup](http://localhost:3000/signup) and create the first user from the UI.

## Local development

If the project is already bootstrapped and your `.env` is set, the usual workflow is:

```bash
npm run db:generate
npm run dev
```

## Environment variables

The template expects:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
AUTH_SECRET="generated-secret"
AUTH_TRUST_HOST="true"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
PORT="3000"
```

These are already provided in `.env.example`. `npm run setup` copies that file into `.env` and replaces the `AUTH_SECRET` placeholder.

## Production runtime

The production container:

- builds the app with `npm run build`
- serves it on `0.0.0.0:3000`
- exposes health on `/api/health`
- can run `npm run db:migrate` at boot when `RUN_DB_MIGRATIONS=true`

## Coolify deployment

Recommended first deployment pattern:

1. Create a new project in Coolify
2. Add a PostgreSQL resource for the app
3. Create a new application from the Git repo
4. Select `Dockerfile` deploy mode
5. Set the port to `3000`
6. Add the required environment variables
7. Set a domain only after the app responds correctly on the internal URL

### Required environment variables

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_TRUST_HOST=true
AUTH_URL=https://your-domain.example
NEXTAUTH_URL=https://your-domain.example
PORT=3000
RUN_DB_MIGRATIONS=false
```

### Migration strategy

Recommended:

- use a single replica per app at first
- keep `RUN_DB_MIGRATIONS=true` only while you are on one instance
- if you later scale horizontally, move migrations to a dedicated deploy step

## Next apps to standardize after this

- `autodoc`
- `finbara-app`

The goal is to make all of them match this template before production migration.


test readme