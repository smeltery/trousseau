import { sql as vercelSql } from '@vercel/postgres'
import pg from 'pg'

function postgresUrl(): string {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
}

/** True when POSTGRES_URL points at local Docker / native Postgres. */
export function isLocalPostgres(): boolean {
  const url = postgresUrl()
  if (!url) return false
  try {
    const host = new URL(url.replace(/^postgresql:\/\//, 'https://')).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

let localPool: pg.Pool | undefined

function getLocalPool(): pg.Pool {
  if (!localPool) {
    const connectionString = postgresUrl()
    if (!connectionString) {
      throw new Error('Missing POSTGRES_URL for local Postgres')
    }
    localPool = new pg.Pool({ connectionString })
  }
  return localPool
}

function toPgQuery(strings: TemplateStringsArray, values: unknown[]): { text: string; values: unknown[] } {
  let text = ''
  const params: unknown[] = []
  for (let i = 0; i < strings.length; i++) {
    text += strings[i]
    if (i < values.length) {
      params.push(values[i])
      text += `$${params.length}`
    }
  }
  return { text, values: params }
}

type SqlResult<T> = { rows: T[] }

async function localSql<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlResult<T>> {
  const { text, values: params } = toPgQuery(strings, values)
  const result = await getLocalPool().query(text, params)
  return { rows: result.rows as T[] }
}

async function localQuery(statement: string): Promise<SqlResult<Record<string, unknown>>> {
  const result = await getLocalPool().query(statement)
  return { rows: result.rows as Record<string, unknown>[] }
}

/**
 * Tagged-template SQL: `pg` for localhost Docker, `@vercel/postgres` for Neon.
 * Also exposes `.query(rawSql)` for migrations.
 */
export const sql = Object.assign(
  async function sqlTag<T>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<SqlResult<T>> {
    if (isLocalPostgres()) return localSql<T>(strings, ...values)
    return vercelSql(strings, ...values) as Promise<SqlResult<T>>
  },
  {
    query: async (statement: string): Promise<SqlResult<Record<string, unknown>>> => {
      if (isLocalPostgres()) return localQuery(statement)
      return vercelSql.query(statement) as Promise<SqlResult<Record<string, unknown>>>
    },
  },
)
