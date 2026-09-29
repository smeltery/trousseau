/**
 * Apply scripts/migrate-cloud.sql using POSTGRES_URL from the environment.
 * Usage: bun run db:migrate  (loads .env.local; works with Docker or Neon)
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from '../api/_lib/db.ts'

const migrationPath = join(import.meta.dir, 'migrate-cloud.sql')
const migration = readFileSync(migrationPath, 'utf8')
const statements = migration
  .split(';')
  .map((s) => s.replace(/^--.*$/gm, '').trim())
  .filter(Boolean)

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error('Missing POSTGRES_URL. Copy .env.example → .env.local (or: vercel env pull .env.local)')
  process.exit(1)
}

for (const statement of statements) {
  await sql.query(statement)
  console.log('ok:', statement.slice(0, 72).replace(/\s+/g, ' '), '…')
}
console.log(`migration complete (${statements.length} statements)`)
