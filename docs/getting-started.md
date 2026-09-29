# Getting started

Trousseau is a shared wedding budget. Opening the tracker creates or resumes a secret sync link.

## Prerequisites

- [Flox](https://flox.dev) (recommended) or [Bun](https://bun.sh) 1.x
- [Docker](https://docs.docker.com/get-docker/) (for local Postgres)
- A recent Chromium, Safari, or Firefox browser

## Local sync (Docker Postgres)

Day-to-day development runs Postgres in Docker and the app on the host via `vercel dev` (UI + `/api`). File attachments write to `public/.local-blob` when `LOCAL_BLOB_DIR` is set; no Vercel Blob token required.

```sh
flox activate   # optional
bun install
cp .env.example .env.local   # Docker Postgres + local blob defaults
bun run db:up                # or just: bun run dev:local
bun run db:migrate
bun run dev:local            # DB up → migrate → vercel dev
```

Open **`http://localhost:3000`** (vercel dev’s port; try `/app` or **Try a filled demo** on the marketing page).

Plain `bun run dev` (Vite on `:5173`) does **not** serve `/api`, so share create/resume returns 404.

| Script | What it does |
| --- | --- |
| `bun run db:up` | `docker compose up -d` (Postgres 16; schema from `scripts/migrate-cloud.sql` on first boot) |
| `bun run db:down` | Stop the container |
| `bun run db:migrate` | Re-apply schema (idempotent `CREATE IF NOT EXISTS`) |
| `bun run dev:local` | DB up → migrate → `vercel dev` (copies `.env.example` → `.env.local` if missing) |
| `bun run dev:vercel` | UI + API only (assumes env + DB already ready) |
| `bun run dev` | Vite UI only: no cloud API |

Use `localhost` (not `127.0.0.1`) in `POSTGRES_URL`. Local Docker uses the `pg` driver via [`api/_lib/db.ts`](../api/_lib/db.ts); Neon/production still uses `@vercel/postgres`.

| Path | What you get |
| --- | --- |
| `/` | Marketing site |
| `/app` | Resume remembered share or create one → soft-navigate to `/b/…` |
| `/app?new=1` | Start a blank budget (asks before replacing; new share link) |
| `/app?demo=1` | Load the filled generic demo (new share link) |
| `/app?import=1` | Redirects to `/?import=1` |
| `/?import=1` | Open the import dialog on the home page (import creates a share link) |
| `/b/<token>` | Shared budget (secret link; anyone with the URL can edit) |

## Production cloud setup

Using the Vercel CLI against Neon + Blob:

```sh
vercel link
vercel integration add neon --name trousseau-postgres --plan free_v3 -m region=iad1 -m auth=false
vercel storage create trousseau-blob --type blob --access public --region iad1
vercel storage connect trousseau-blob --auth token --add-rw-token --yes
vercel env pull .env.local
bun run db:migrate
vercel deploy --prod
```

For production-style local runs without Docker, set `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`, unset `LOCAL_BLOB_DIR`, then `bun run dev:vercel`.

## First load

A new tracker starts blank with starter categories and **Groom & Bride** on the hero, then lands on a share URL. Click any label to rename it. Use **Try demo** / **Load demo** for sample numbers, or download [`sample-wedding.zip`](../public/samples/sample-wedding.zip) and import it.
