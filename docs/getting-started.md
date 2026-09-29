# Getting started

Trousseau is a shared wedding budget. Opening the tracker creates or resumes a secret sync link.

## Prerequisites

- [Flox](https://flox.dev) (recommended) or [Bun](https://bun.sh) 1.x
- A recent Chromium, Safari, or Firefox browser
- For full sync: a Vercel deploy with Postgres + Blob (see below)

## Install and run

With Flox (preferred):

```sh
flox activate
bun install
bun run dev          # Vite UI only
bun run dev:vercel   # UI + cloud API (needs .env.local — see Cloud setup)
```

With Bun alone:

```sh
bun install
bun run dev          # or: bun run dev:vercel
```

Open the URL Vite prints (usually `http://localhost:5173`). The tracker needs Postgres + Blob env (local `vercel dev` or a deployed backend).

| Path | What you get |
| --- | --- |
| `/` | Marketing site |
| `/app` | Opens your synced budget (resumes or creates a share link → `/b/…`) |
| `/app?new=1` | Start a blank budget (asks before replacing; new share link) |
| `/app?demo=1` | Load the filled generic demo (asks before replacing; new share link) |
| `/app?import=1` | Open the import dialog (import creates a share link) |
| `/b/<token>` | Shared budget (secret link; anyone with the URL can edit) |

## Cloud setup

Using the Vercel CLI:

```sh
vercel link
vercel integration add neon --name trousseau-postgres --plan free_v3 -m region=iad1 -m auth=false
vercel storage create trousseau-blob --type blob --access public --region iad1
vercel storage connect trousseau-blob --auth token --add-rw-token --yes
vercel env pull .env.local
bun run db:migrate
vercel deploy --prod
```

Or copy [`.env.example`](../.env.example), set `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`, run `bun run db:migrate`, then `bun run dev:vercel`.

## First load

A new tracker starts blank with starter categories and **Groom & Bride** on the hero, then lands on a share URL. Click any label to rename it. Use **Try demo** / **Load demo** for sample numbers, or download [`sample-wedding.zip`](../public/samples/sample-wedding.zip) and import it.
