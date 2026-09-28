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
| `/app` | Blank tracker (or your existing local data) |
| `/app?demo=1` | Prompt to load the filled demo sample |

## First load

A new tracker starts blank with starter categories. Click any label to rename it. Use **Load demo** under Backup, or the marketing demo link, for sample numbers.
