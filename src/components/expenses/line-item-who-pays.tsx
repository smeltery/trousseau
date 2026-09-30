import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { WhoPays } from '../../db/types'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'
import { LineItemField } from './line-item-field'

export function LineItemWhoPaysField({
  value,
  onPersist,
}: {
  value: WhoPays | ''
  onPersist: (next: WhoPays | undefined) => void
}) {
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE

  return (
    <LineItemField label="Who pays">
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value as WhoPays | ''
          onPersist(next || undefined)
        }}
        className="field-input"
      >
        <option value="">Unset</option>
        <option value="joint">Joint</option>
        <option value="left">{site.brandLeft}</option>
        <option value="right">{site.brandRight}</option>
      </select>
    </LineItemField>
  )
}
