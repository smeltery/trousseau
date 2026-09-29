import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { del as vercelDel, put as vercelPut } from '@vercel/blob'

export interface BlobPutResult {
  url: string
  pathname: string
}

function localBlobDir(): string | null {
  const dir = process.env.LOCAL_BLOB_DIR?.trim()
  return dir || null
}

function localPublicUrl(pathname: string): string {
  const base = (process.env.LOCAL_BLOB_PUBLIC_URL || 'http://localhost:3000/.local-blob').replace(
    /\/$/,
    '',
  )
  return `${base}/${pathname.replace(/^\//, '')}`
}

/** Store a file in local FS (dev) or Vercel Blob (prod). */
export async function putBlob(
  pathname: string,
  body: Buffer,
  opts: { contentType: string },
): Promise<BlobPutResult> {
  const dir = localBlobDir()
  if (dir) {
    const full = join(dir, pathname)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, body)
    return { url: localPublicUrl(pathname), pathname }
  }
  const blob = await vercelPut(pathname, body, {
    access: 'public',
    contentType: opts.contentType,
    addRandomSuffix: false,
  })
  return { url: blob.url, pathname: blob.pathname }
}

/** Delete a stored file; no-op if missing. */
export async function deleteBlob(pathname: string): Promise<void> {
  const dir = localBlobDir()
  if (dir) {
    try {
      await unlink(join(dir, pathname))
    } catch {
      // Already gone.
    }
    return
  }
  await vercelDel(pathname)
}
