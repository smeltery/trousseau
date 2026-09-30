import { useEffect, useState } from 'react'
import { truncateShareUrl } from '../../lib/ux/format-share-url'
import { formatSyncedAt } from '../../lib/ux/relative-time'
import { pushCloudBudget } from '../../lib/cloud/sync'
import {
  getLastSavedAt,
  subscribeLastSavedAt,
  type SyncStatus,
} from '../../lib/sync-status'

export function SyncBanner({
  syncLabel,
  sync,
  shareUrl,
  onCopyShare,
}: {
  syncLabel: string | null
  sync: SyncStatus
  shareUrl?: string
  onCopyShare: () => void
}) {
  const [savedAt, setSavedAt] = useState<number | null>(() => getLastSavedAt())
  const [tick, setTick] = useState(0)

  useEffect(() => subscribeLastSavedAt(setSavedAt), [])
  useEffect(() => {
    if (!savedAt || syncLabel) return
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [savedAt, syncLabel])

  const fresh = savedAt ? formatSyncedAt(savedAt) : ''
  void tick

  return (
    <div className="border-b border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_88%,transparent)] px-[var(--page-pad)] py-2.5 text-center backdrop-blur-md">
      <p className="text-sm text-[var(--on-dark-muted)]">
        {syncLabel ? (
          <>
            <span
              className={
                sync === 'error' || sync === 'offline'
                  ? 'font-semibold text-[var(--accent)]'
                  : 'font-semibold text-[var(--lichen)]'
              }
            >
              {syncLabel}
            </span>
            {sync === 'error' ? (
              <>
                {' · '}
                <button
                  type="button"
                  className="underline decoration-1 underline-offset-4"
                  onClick={() => void pushCloudBudget()}
                >
                  Retry
                </button>
              </>
            ) : (
              ' · '
            )}
          </>
        ) : fresh ? (
          <span className="text-[var(--on-dark-faint)]">Synced {fresh} · </span>
        ) : null}
        Synced budget · treat the link like a password.
        {shareUrl ? (
          <>
            {' '}
            <span className="font-[family-name:var(--font-body)] text-[var(--on-dark-faint)]" title={shareUrl}>
              {truncateShareUrl(shareUrl)}
            </span>
            {' · '}
            <button
              type="button"
              onClick={onCopyShare}
              className="font-semibold text-[var(--accent)] underline decoration-1 underline-offset-4 hover:text-[var(--on-dark)]"
            >
              Copy
            </button>
          </>
        ) : null}
      </p>
    </div>
  )
}
