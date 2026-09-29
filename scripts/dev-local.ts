/**
 * Bring up local Postgres, migrate, then run vercel dev (UI + API).
 */
import { spawn } from 'node:child_process'
import { existsSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const envLocal = join(root, '.env.local')
const envExample = join(root, '.env.example')

function run(cmd: string, args: string[], opts?: { inherit?: boolean }): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: opts?.inherit === false ? 'pipe' : 'inherit',
      shell: false,
    })
    child.on('error', reject)
    child.on('close', (code) => resolve(code ?? 1))
  })
}

async function waitForDb(maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = await run(
      'docker',
      ['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'trousseau', '-d', 'trousseau'],
      { inherit: false },
    )
    if (code === 0) return
    await Bun.sleep(500)
  }
  throw new Error('Postgres did not become ready in time')
}

if (!existsSync(envLocal) && existsSync(envExample)) {
  copyFileSync(envExample, envLocal)
  console.log('Created .env.local from .env.example')
}

console.log('Starting Postgres…')
const up = await run('docker', ['compose', 'up', '-d'])
if (up !== 0) process.exit(up)

await waitForDb()
console.log('Postgres ready')

const migrate = await run('bun', ['run', 'db:migrate'])
if (migrate !== 0) process.exit(migrate)

console.log('Starting vercel dev…')
const vercel = await run('bunx', ['vercel', 'dev'])
process.exit(vercel)
