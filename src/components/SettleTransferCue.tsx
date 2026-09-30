import type { LineItem } from '../db/types'
import { askConfirm } from '../lib/confirm'
import { showToast } from '../lib/toast'
import {
  formatNetSettlement,
  netWhoPaysSettlement,
  recordSettlementTransfer,
} from '../lib/ux/settle-transfer'
import {
  formatSettlementCue,
  whoPaysSettlement,
} from '../lib/ux/who-pays-rollup'
import type { SiteSettings } from '../lib/site-settings'

/** Settle cue + optional “Record transfer” for net A→B. */
export function SettleTransferCue({
  site,
  lineItems,
  className,
}: {
  site: SiteSettings
  lineItems: LineItem[]
  className?: string
}) {
  const settle = whoPaysSettlement(lineItems, site)
  if (!settle?.some((s) => s.owes > 0 || s.paid > 0)) return null
  const net = netWhoPaysSettlement(settle)

  return (
    <p className={className} role="status">
      <span className="font-semibold">Settle-up · </span>
      {net ? formatNetSettlement(net) : formatSettlementCue(settle)}
      {net ? (
        <>
          {' · '}
          <button
            type="button"
            className="underline decoration-1 underline-offset-4 hover:opacity-80"
            onClick={async () => {
              const ok = await askConfirm({
                title: `Record ${formatNetSettlement(net)}?`,
                body: 'Adds a Transfer payment stub on a who-pays expense.',
                confirmLabel: 'Record transfer',
              })
              if (!ok) return
              try {
                await recordSettlementTransfer(lineItems, net)
                showToast('Transfer recorded')
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Could not record')
              }
            }}
          >
            Record transfer
          </button>
        </>
      ) : null}
    </p>
  )
}
