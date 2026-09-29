# Trousseau

[![CI](https://github.com/smeltery/trousseau/actions/workflows/ci.yml/badge.svg)](https://github.com/smeltery/trousseau/actions/workflows/ci.yml)
[![License: PolyForm Shield 1.0.0](https://img.shields.io/badge/license-PolyForm%20Shield%201.0.0-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-bun-fbf0df?logo=bun&logoColor=000)](https://bun.sh)
[![React](https://img.shields.io/badge/ui-react%2019-61dafb?logo=react&logoColor=20232a)](https://react.dev)
[![Vite](https://img.shields.io/badge/build-vite-646cff?logo=vite&logoColor=fff)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/style-tailwind%204-38bdf8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![Dexie](https://img.shields.io/badge/storage-dexie%20%2F%20IndexedDB-f472b6)](https://dexie.org)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](.pre-commit-config.yaml)
[![Dev env: Flox](https://img.shields.io/badge/dev%20env-flox-7c3aed.svg)](https://flox.dev)

<p align="center">
  <img src="public/og.png" alt="Trousseau: a wedding budget that lives with you" width="800" />
</p>

Wedding budget tracker synced by a secret share link. Open `/app` to resume or create your budget; export a zip anytime for an offline archive.

```sh
flox activate   # optional, recommended
bun install
bun run dev
```

| Path | What you get |
| --- | --- |
| `/` | Marketing site |
| `/app` | Opens synced budget (→ `/b/…`) |
| `/app?new=1` | Start a blank budget (asks before replacing) |
| `/app?demo=1` | Load the filled generic demo (asks before replacing) |
| `/app?import=1` | Open the import dialog |
| `/b/<token>` | Shared budget via secret link |

A downloadable sample wedding zip lives at [`public/samples/sample-wedding.zip`](public/samples/sample-wedding.zip) (`bun run sample:wedding` rebuilds it).

Cloud needs Vercel Postgres + Blob — see [`docs/getting-started.md`](docs/getting-started.md).

## Docs

See [`docs/`](docs/) for getting started, how it works, privacy, and architecture. Contribution gates are in [`CONTRIBUTING.md`](CONTRIBUTING.md).
