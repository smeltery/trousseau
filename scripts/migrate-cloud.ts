/**
 * Apply scripts/migrate-cloud.sql using POSTGRES_URL from the environment.
 * Usage: vercel env run -- bun run scripts/migrate-cloud.ts
 *    or: set -a && source .env.local && set +a && bun run scripts/migrate-cloud.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from '@vercel/postgres'

const migrationPath = join(import.meta.dir, 'migrate-cloud.sql')
const migration = readFileSync(migrationPath, 'utf8')
const statements = migration
  .split(';')
  .map((s) => s.replace(/^--.*$/gm, '').trim())
  .filter(Boolean)

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error('Missing POSTGRES_URL. Run: vercel env pull .env.local')
  process.exit(1)
}

for (const statement of statements) {
  await sql.query(statement)
  console.log('ok:', statement.slice(0, 72).replace(/\s+/g, ' '), '…')
}
console.log(`migration complete (${statements.length} statements)`)
