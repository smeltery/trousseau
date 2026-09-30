# Trousseau

[![CI](https://github.com/smeltery/trousseau/actions/workflows/ci.yml/badge.svg)](https://github.com/smeltery/trousseau/actions/workflows/ci.yml)
[![License: PolyForm Shield 1.0.0](https://img.shields.io/badge/license-PolyForm%20Shield%201.0.0-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-bun-fbf0df?logo=bun&logoColor=000)](https://bun.sh)
[![React](https://img.shields.io/badge/ui-react%2019-61dafb?logo=react&logoColor=20232a)](https://react.dev)
[![Vite](https://img.shields.io/badge/build-vite-646cff?logo=vite&logoColor=fff)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/style-tailwind%204-38bdf8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/sync-Postgres%20%2B%20Blob-000?logo=vercel&logoColor=fff)](https://vercel.com)
[![Dexie](https://img.shields.io/badge/cache-dexie%20%2F%20IndexedDB-f472b6)](https://dexie.org)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](.pre-commit-config.yaml)
[![Dev env: Flox](https://img.shields.io/badge/dev%20env-flox-7c3aed.svg)](https://flox.dev)

<p align="center">
  <img src="public/og.png" alt="Trousseau: one wedding budget for both of you, synced by a secret link" width="800" />
</p>

Wedding budget tracker with **no accounts**: a secret share URL is the password. Opening `/app` resumes or creates a synced budget at `/b/…`; anyone with that link can edit. Export a zip anytime for an offline archive. Each browser keeps an IndexedDB cache for a fast UI; Postgres + Blob hold the live data.

```sh
flox activate   # optional, recommended
bun install
cp .env.example .env.local   # Docker Postgres + local blob defaults
bun run dev:local            # Postgres in Docker + vercel dev → http://localhost:3000
# bun run dev                # Vite UI only: no /api (share create will 404)
```

Requires [Docker](https://docs.docker.com/get-docker/) for local Postgres. Full setup, scripts, and production Neon/Blob: [`docs/getting-started.md`](docs/getting-started.md).

| Path | What you get |
| --- | --- |
| `/` | Marketing site |
| `/app` | Resume or create a share link → `/b/…` |
| `/app?new=1` | Blank budget (new share link) |
| `/app?demo=1` | Fresh randomized demo budget (new share link) |
| `/?import=1` | Import a zip over the home page (creates a new share link) |
| `/b/<token>` | Shared budget: treat the URL like a password |

A downloadable sample wedding zip lives at [`public/samples/sample-wedding.zip`](public/samples/sample-wedding.zip) (`bun run sample:wedding` rebuilds it).

## Why Trousseau?

A *trousseau* is the collection of clothes, linens, and keepsakes traditionally gathered for marriage. This app borrows the word for the modern pile: gifts and savings coming in, vendor lines going out, receipts and notes beside the dollars. One shared link holds that collection for both of you until the day arrives.

## Docs

See [`docs/`](docs/) for getting started, how it works, privacy, and architecture. Contribution gates are in [`CONTRIBUTING.md`](CONTRIBUTING.md).
