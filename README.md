# svelte-pg-data-browser

A simple web app to browse data tables built with Svelte and Typescript

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

Database prerequisites:
- You must have a reachable PostgreSQL instance and an existing database with the tables you want to browse.
- There are no migrations or seed scripts in this repo; create schema/data externally before startup.
