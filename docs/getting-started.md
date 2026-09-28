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

## First load

A new tracker starts blank with starter categories and **Groom & Bride** on the hero. Click any label to rename it. Use **Try demo** / **Load demo** for sample numbers, or download [`sample-wedding.zip`](../public/samples/sample-wedding.zip) and import it.
