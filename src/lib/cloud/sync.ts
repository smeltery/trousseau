import type { Attachment } from '../../db/types'
import { db } from '../../db/dexie'
import { applyBackupPayload, buildBackupPayload } from '../export-import'
import { askChoice } from '../confirm'
import {
  apiCreateBudget,
  apiGetBudget,
  apiPutBudget,
  apiUploadFile,
  type CloudSnapshot,
} from './api-client'
import {
  CLOUD_TOKEN_META,
  CLOUD_UPDATED_META,
  clearRememberedShareToken,
  getActiveCloudToken,
  readRememberedShareToken,
  rememberShareToken,
  setActiveCloudToken,
} from './session'
import { clearPendingEdits, hasUnsyncedEdits, setSyncStatus } from '../sync-status'

let pushTimer: ReturnType<typeof setTimeout> | undefined
let pushing = false
let pullPaused = false
let conflictOpen = false

function snapshotToAttachments(snapshot: CloudSnapshot): Attachment[] {
  return snapshot.attachments.map((att) => ({
    id: att.id,
    lineItemId: att.lineItemId,
    kind: att.kind,
    name: att.name,
    url: att.url,
    mime: att.mime,
    size: att.size,
    createdAt: att.createdAt,
  }))
}

/** Load shared budget into IndexedDB and activate cloud session. */
export async function enterCloudBudget(token: string): Promise<void> {
  pullPaused = true
  try {
    const snapshot = await apiGetBudget(token)
    await applyBackupPayload(snapshot, snapshotToAttachments(snapshot))
    await db.meta.put({ key: CLOUD_TOKEN_META, value: token })
    await db.meta.put({ key: CLOUD_UPDATED_META, value: snapshot.updatedAt })
    setActiveCloudToken(token)
    rememberShareToken(token)
    clearPendingEdits()
  } finally {
    pullPaused = false
  }
}

/** Leave cloud push mode (local /app). Keeps current IndexedDB data. */
export async function leaveCloudBudget(opts?: { forget?: boolean }): Promise<void> {
  setActiveCloudToken(null)
  await db.meta.delete(CLOUD_TOKEN_META)
  await db.meta.delete(CLOUD_UPDATED_META)
  if (opts?.forget) clearRememberedShareToken()
  if (pushTimer) clearTimeout(pushTimer)
  clearPendingEdits()
}

/** Publish current local budget; returns share URL. Uploads file blobs after create. */
export async function publishShareLink(): Promise<{ token: string; url: string }> {
  const { payload, files } = await buildBackupPayload()
  const created = await apiCreateBudget(payload)
  for (const file of files) {
    const uploaded = await apiUploadFile(created.token, file)
    await db.attachments.update(file.id, {
      url: uploaded.url,
      blob: undefined,
      size: uploaded.size,
    })
  }
  rememberShareToken(created.token)
  return created
}

/**
 * Resume the last share token or publish the current IndexedDB budget.
 * Every /app boot (except import dialog) ends here.
 */
export async function ensureCloudBudget(): Promise<{ token: string; url: string }> {
  const candidates = [readRememberedShareToken()]
  const meta = await db.meta.get(CLOUD_TOKEN_META)
  if (meta?.value && meta.value !== candidates[0]) candidates.push(meta.value)

  for (const token of candidates) {
    if (!token) continue
    try {
      await apiGetBudget(token)
      rememberShareToken(token)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      return { token, url: origin ? `${origin}/b/${token}` : `/b/${token}` }
    } catch {
      if (token === readRememberedShareToken()) clearRememberedShareToken()
    }
  }

  return publishShareLink()
}

export function scheduleCloudPush(): void {
  const token = getActiveCloudToken()
  if (!token || pullPaused) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void pushCloudBudget()
  }, 700)
}

export async function pushCloudBudget(): Promise<void> {
  const token = getActiveCloudToken()
  if (!token || pushing || pullPaused) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setSyncStatus('offline')
    return
  }
  pushing = true
  setSyncStatus('saving')
  try {
    const { payload } = await buildBackupPayload()
    // Include file metadata that already has cloud urls; local-only blobs stay out of PUT
    // (they should have been uploaded via attachment API).
    const { updatedAt } = await apiPutBudget(token, payload)
    await db.meta.put({ key: CLOUD_UPDATED_META, value: updatedAt })
    clearPendingEdits()
    setSyncStatus('saved')
  } catch (err) {
    console.error(err)
    setSyncStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error')
  } finally {
    pushing = false
  }
}

async function applyRemote(token: string, remote: CloudSnapshot): Promise<void> {
  pullPaused = true
  try {
    await applyBackupPayload(remote, snapshotToAttachments(remote))
    await db.meta.put({ key: CLOUD_TOKEN_META, value: token })
    await db.meta.put({ key: CLOUD_UPDATED_META, value: remote.updatedAt })
    clearPendingEdits()
  } finally {
    pullPaused = false
  }
}

/** Pull server snapshot if newer (focus / visibility). Blocks silent overwrite when dirty. */
export async function pullCloudBudgetIfStale(): Promise<boolean> {
  const token = getActiveCloudToken()
  if (!token || pullPaused || conflictOpen) return false
  const remote = await apiGetBudget(token)
  const local = await db.meta.get(CLOUD_UPDATED_META)
  if (local?.value && local.value === remote.updatedAt) return false

  if (hasUnsyncedEdits()) {
    conflictOpen = true
    try {
      const choice = await askChoice({
        title: 'Partner updated this budget',
        body: 'You have edits that have not synced yet. Keeping yours pushes your version; taking theirs replaces your local changes.',
        primaryLabel: 'Keep mine',
        secondaryLabel: 'Take theirs',
        cancelLabel: 'Not now',
        secondaryDanger: true,
      })
      if (choice === 'primary') {
        await pushCloudBudget()
        return false
      }
      if (choice === 'secondary') {
        await applyRemote(token, remote)
        return true
      }
      return false
    } finally {
      conflictOpen = false
    }
  }

  await applyRemote(token, remote)
  return true
}
