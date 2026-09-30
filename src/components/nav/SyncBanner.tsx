import { pushCloudBudget } from '../../lib/cloud/sync'
import type { SyncStatus } from '../../lib/sync-status'

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
        ) : null}
        Synced budget · anyone with this link can edit.
        {shareUrl ? (
          <>
            {' '}
            <button
              type="button"
              onClick={onCopyShare}
              className="font-semibold text-[var(--accent)] underline decoration-1 underline-offset-4 hover:text-[var(--on-dark)]"
            >
              Copy link
            </button>
          </>
        ) : null}
      </p>
    </div>
  )
}
