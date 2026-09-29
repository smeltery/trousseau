import type { Attachment } from '../../db/types'
import { db } from '../../db/dexie'
import { applyBackupPayload, buildBackupPayload } from '../export-import'
import {
  apiCreateBudget,
  apiGetBudget,
  apiPutBudget,
  apiUploadFile,
  type CloudSnapshot,
} from './api-client'
import { CLOUD_TOKEN_META, CLOUD_UPDATED_META, getActiveCloudToken, setActiveCloudToken } from './session'

let pushTimer: ReturnType<typeof setTimeout> | undefined
let pushing = false
let pullPaused = false

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
  } finally {
    pullPaused = false
  }
}

/** Leave cloud push mode (local /app). Keeps current IndexedDB data. */
export async function leaveCloudBudget(): Promise<void> {
  setActiveCloudToken(null)
  await db.meta.delete(CLOUD_TOKEN_META)
  await db.meta.delete(CLOUD_UPDATED_META)
  if (pushTimer) clearTimeout(pushTimer)
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
  return created
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
  pushing = true
  try {
    const { payload } = await buildBackupPayload()
    // Include file metadata that already has cloud urls; local-only blobs stay out of PUT
    // (they should have been uploaded via attachment API).
    const { updatedAt } = await apiPutBudget(token, payload)
    await db.meta.put({ key: CLOUD_UPDATED_META, value: updatedAt })
  } finally {
    pushing = false
  }
}

/** Pull server snapshot if newer (focus / visibility). */
export async function pullCloudBudgetIfStale(): Promise<boolean> {
  const token = getActiveCloudToken()
  if (!token || pullPaused) return false
  const remote = await apiGetBudget(token)
  const local = await db.meta.get(CLOUD_UPDATED_META)
  if (local?.value && local.value === remote.updatedAt) return false
  pullPaused = true
  try {
    await applyBackupPayload(remote, snapshotToAttachments(remote))
    await db.meta.put({ key: CLOUD_TOKEN_META, value: token })
    await db.meta.put({ key: CLOUD_UPDATED_META, value: remote.updatedAt })
    return true
  } finally {
    pullPaused = false
  }
}
