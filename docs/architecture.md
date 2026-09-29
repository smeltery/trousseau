# Architecture

High-level shape of the Vite + React app, with optional cloud share.

```mermaid
flowchart TB
  subgraph ui [UI]
    marketing["MarketingPage /"]
    tracker["TrackerApp /app and /b/token"]
  end
  subgraph data [Local data]
    dexie["Dexie / IndexedDB"]
    seed["seed.ts demo and blank"]
  end
  subgraph io [Portable backup]
    zip["JSZip export and import"]
  end
  subgraph cloud [Optional share]
    api["Vercel api/budgets"]
    pg["Vercel Postgres"]
    blob["Vercel Blob"]
  end
  marketing --> tracker
  tracker --> dexie
  seed --> dexie
  tracker --> zip
  zip --> dexie
  tracker -->|"Create share / sync"| api
  api --> pg
  api --> blob
```

| Layer | Location | Notes |
| --- | --- | --- |
| Routes | `src/main.tsx` | `/` marketing, `/app` local tracker, `/b/:token` shared tracker |
| UI | `src/pages/`, `src/components/` | Marketing under `pages/marketing/` |
| Domain helpers | `src/lib/` | Money, site settings, backup, cloud client/sync, budget-store adapters |
| Persistence | `src/db/` | Dexie schema, blank/demo seed, sample archive, lifecycle |
| Cloud API | `api/` | Token-gated budget CRUD + attachment upload (Postgres + Blob) |
| Schema | `scripts/migrate-cloud.sql` | One-shot SQL for shared budgets |

**Budget stores:** `localBudgetStore` seeds/clears cloud session on `/app`. `cloudBudgetStore` loads `/api/budgets/:token` into Dexie and keeps an active token so `dbWrite` debounces PUT sync. Focus/visibility pulls if the server `updatedAt` changed.

Dev tooling: Bun for install/scripts (including `sample:wedding`), Flox for a reproducible shell, pre-commit and CI for lint, typecheck, budgets, sample zip, and Markdown/mermaid hygiene. Cloud APIs need `vercel dev` (or deployed env) with `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`.
