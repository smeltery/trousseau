/**
 * Build the sample wedding zip into public/samples/.
 * Source data: src/db/sample-nick-lauren.ts (personal archive).
 * Run: bun run sample:wedding
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import { nickLaurenBackupPayload } from '../src/db/sample-nick-lauren'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'samples')
const outFile = join(outDir, 'sample-wedding.zip')
const legacyFile = join(outDir, 'nick-lauren-wedding.zip')

const zip = new JSZip()
zip.file('trousseau.json', JSON.stringify(nickLaurenBackupPayload(), null, 2))
const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, bytes)
try {
  rmSync(legacyFile)
} catch {
  // Legacy name may not exist.
}
console.log(`Wrote ${outFile} (${bytes.byteLength} bytes)`)
