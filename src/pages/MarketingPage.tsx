import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MarketingHero } from './marketing/Hero'
import {
  CalendarSection,
  HowSection,
  InsideSection,
  NameSection,
  WhySection,
  YoursSection,
} from './marketing/FeatureSections'
import {
  BackupSection,
  BeginSection,
  PrivacySection,
  QuestionsSection,
} from './marketing/TrustSections'
import { MarketingFooter } from './marketing/Footer'
import { ImportBackupDialog } from '../components/ImportBackupDialog'
import { Reveal } from '../components/Reveal'
import { celebrate } from '../lib/celebrate'
import { goToSharedBudget } from '../lib/cloud/navigate'
import { enterCloudBudget } from '../lib/cloud/sync'
import { showToast } from '../lib/toast'

/** Section ids on `/` that footer + nav hash links may target. */
const MARKETING_SECTION_IDS = new Set(['name', 'due', 'how', 'privacy', 'backup', 'questions'])

export function MarketingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const importOpen = searchParams.get('import') === '1'

  useEffect(() => {
    const id = location.hash.replace(/^#/, '')
    if (!id || !MARKETING_SECTION_IDS.has(id)) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.hash])

  function closeImport() {
    const next = new URLSearchParams(searchParams)
    next.delete('import')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="overflow-x-clip">
      <MarketingHero />
      <Reveal>
        <NameSection />
      </Reveal>
      <Reveal delayMs={40}>
        <WhySection />
      </Reveal>
      <Reveal delayMs={40}>
        <InsideSection />
      </Reveal>
      <Reveal delayMs={40}>
        <CalendarSection />
      </Reveal>
      <Reveal delayMs={40}>
        <HowSection />
      </Reveal>
      <Reveal delayMs={40}>
        <YoursSection />
      </Reveal>
      <Reveal>
        <PrivacySection />
      </Reveal>
      <Reveal delayMs={40}>
        <BackupSection />
      </Reveal>
      <Reveal delayMs={40}>
        <QuestionsSection />
      </Reveal>
      <Reveal>
        <BeginSection />
      </Reveal>
      <MarketingFooter />

      {importOpen ? (
        <ImportBackupDialog
          onClose={closeImport}
          onImported={(share) => {
            if (!share) {
              showToast('Import needs a share link. Try again.')
              return
            }
            void (async () => {
              try {
                await enterCloudBudget(share.token)
                showToast('Imported: share link copied')
                celebrate()
                goToSharedBudget(share.token, navigate)
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Could not open imported budget')
              }
            })()
          }}
        />
      ) : null}
    </div>
  )
}
