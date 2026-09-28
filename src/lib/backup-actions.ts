import { downloadBlob, exportBackup, importBackup } from './export-import'

export function isTrousseauZip(file: File): boolean {
  return file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip'
}

/** Replace local data from a Trousseau .zip. Caller handles confirmation UI. */
export async function restoreBackupZip(file: File): Promise<string> {
  if (!isTrousseauZip(file)) {
    throw new Error('Choose a Trousseau .zip backup.')
  }
  await importBackup(file)
  return `Restored “${file.name}”.`
}

export async function downloadBackupZip(): Promise<void> {
  const blob = await exportBackup()
  const stamp = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `trousseau-backup-${stamp}.zip`)
}
