# Agents Guide

This repo is a SvelteKit + TypeScript app that browses PostgreSQL tables (customers/accounts) with server-side API routes.

## Quick Start

1. Create `.env` from `.env.example`.
2. Set:
   - `SECRET_PGUSER`
   - `SECRET_PGPASSWORD`
   - `SECRET_PGHOST`
   - `SECRET_PGPORT`
   - `SECRET_PGDATABASE`
3. Install and run:
   - `npm install`
   - `npm run dev`

## Project Structure

- `src/routes/+page.svelte` Home page
- `src/routes/customer/+page.svelte` Customer list + search
- `src/routes/customer/[slug]/+page.svelte` Customer details
- `src/routes/account/+page.svelte` Account list
- `src/routes/account/[slug]/+page.svelte` Account details
- `src/routes/api/customer/search/+server.ts` Customer search API
- `src/routes/api/customer/[slug]/+server.ts` Customer details API
- `src/routes/api/account/[slug]/+server.ts` Account details API
- `src/routes/+layout.svelte` Global layout (breadcrumbs)
- `src/app.css` Global Tailwind styles (table styling, base typography)
- `tailwind.config.cjs` Tailwind theme + content paths
- `postcss.config.cjs` PostCSS pipeline for Tailwind

## UI Notes

- Breadcrumbs are rendered in `src/routes/+layout.svelte` and use `$app/state`.
- Customer search updates a local `$state` array rather than mutating `data` from `$props()`.
- The home page search redirects to `/customer?search=...` and the customer page pre-populates the input + runs `/api/customer/search`.
- Table styling (zebra rows + hover) is defined globally in `src/app.css`.

## Database Notes

- No migrations or seed scripts exist; schema/data must be created externally.
- The app expects existing `customers` and `accounts` tables (see server routes for fields used).

## Common Scripts

- `npm run dev` Start dev server
- `npm run build` Production build
- `npm run preview` Preview production build

## Troubleshooting

- If list pages render but search does not update, verify the search API response contains `customers`.
- If type errors mention `$app/stores`, use `$app/state` instead.
