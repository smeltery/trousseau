# Architecture

High-level shape of the Vite + React app.

```mermaid
flowchart TB
  subgraph ui [UI]
    marketing["MarketingPage /"]
    tracker["TrackerApp /app"]
  end
  subgraph data [Local data]
    dexie["Dexie / IndexedDB"]
    seed["seed.ts demo and blank"]
  end
  subgraph io [Portable backup]
    zip["JSZip export and import"]
  end
  marketing --> tracker
  tracker --> dexie
  seed --> dexie
  tracker --> zip
  zip --> dexie
```

| Layer | Location | Notes |
| --- | --- | --- |
| Routes | `src/main.tsx` | `/` marketing, `/app` tracker |
| UI | `src/pages/`, `src/components/` | Marketing split under `pages/marketing/` |
| Domain helpers | `src/lib/` | Money, site settings, export/import |
| Persistence | `src/db/` | Dexie schema, seed, lifecycle |

Dev tooling: Bun for install/scripts, Flox for a reproducible shell, pre-commit and CI for lint, typecheck, budgets, and Markdown/mermaid hygiene.
