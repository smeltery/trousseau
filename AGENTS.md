# Trousseau agent notes

## Sources of truth

- Blank + generic demo data: `src/db/seed.ts`
- Personal wedding archive (source only): `src/db/sample-nick-lauren.ts` → public download `public/samples/sample-wedding.zip` (`bun run sample:wedding`)
- UI: React components under `src/`
- Sketch assets: `src/assets/sketches/{rings,bouquet,venue}.png`
- Cloud share API: `api/` + `scripts/migrate-cloud.sql` (Vercel Postgres + Blob; see `.env.example`)
- Local Docker Postgres: `docker-compose.yml` + `bun run dev:local` (attachments via `LOCAL_BLOB_DIR` → `public/.local-blob`)
