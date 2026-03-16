# svelte-pg-data-browser

A simple web app to browse PostgreSQL data tables built with SvelteKit and TypeScript.

## Features

- List customers and accounts
- Detail pages per record
- Server-side API routes for data access
- Quick search on customers

## Setup

1. Copy the environment template and fill in the PostgreSQL connection values:

   ```bash
   cp .env.example .env
   ```

   Set `SECRET_PGUSER`, `SECRET_PGPASSWORD`, `SECRET_PGHOST`, `SECRET_PGPORT`, and `SECRET_PGDATABASE` in `.env`.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run locally:

   ```bash
   npm run dev
   ```

4. Build and preview (optional):

   ```bash
   npm run build
   npm run preview
   ```

## Usage

- Home: `/`
- Customers: `/customer`
- Customer detail: `/customer/[id]`
- Accounts: `/account`
- Account detail: `/account/[id]`

## Scripts

- `npm run dev` Start the dev server
- `npm run build` Build for production
- `npm run preview` Preview the production build

Database prerequisites:

- You must have a reachable PostgreSQL instance and an existing database with the tables you want to browse.
- There are no migrations or seed scripts in this repo; create schema/data externally before startup.
