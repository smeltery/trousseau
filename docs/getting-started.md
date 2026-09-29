# Getting started

Trousseau is a local-first wedding budget. Numbers live in your browser until you export a zip.

## Prerequisites

- [Flox](https://flox.dev) (recommended) or [Bun](https://bun.sh) 1.x
- A recent Chromium, Safari, or Firefox browser

## Install and run

With Flox (preferred):

```sh
flox activate
bun install
bun run dev
```

With Bun alone:

```sh
bun install
bun run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

| Path | What you get |
| --- | --- |
| `/` | Marketing site |
| `/app` | Tracker (keeps existing local data, or seeds blank on first visit) |
| `/app?new=1` | Start a blank budget (asks before replacing local data) |
| `/app?demo=1` | Load the filled generic demo (asks before replacing) |
| `/app?import=1` | Open the import dialog |
| `/b/<token>` | Shared budget (secret link; anyone with the URL can edit) |

## Cloud share (optional)

Local mode needs no backend. Share links use Vercel Postgres (Neon) + Blob.

Using the Vercel CLI (preferred):

```sh
vercel link
vercel integration add neon --name trousseau-postgres --plan free_v3 -m region=iad1 -m auth=false
vercel storage create trousseau-blob --type blob --access public --region iad1
vercel storage connect trousseau-blob --auth token --add-rw-token --yes
vercel env pull .env.local
bun run db:migrate   # applies scripts/migrate-cloud.sql
vercel deploy --prod
```

Or manually: copy [`.env.example`](../.env.example), set `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`, run `bun run db:migrate`, then `vercel dev` / deploy.

Without those env vars, **Create share link** will fail; zip export/import still works.

## First load

A new tracker starts blank with starter categories and **Groom & Bride** on the hero. Click any label to rename it. Use **Try demo** / **Load demo** for sample numbers, or download [`sample-wedding.zip`](../public/samples/sample-wedding.zip) and import it.
