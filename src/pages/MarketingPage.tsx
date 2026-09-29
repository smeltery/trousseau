import { useNavigate, useSearchParams } from 'react-router-dom'
import { MarketingHero } from './marketing/Hero'
import {
  HowSection,
  InsideSection,
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

export function MarketingPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const importOpen = searchParams.get('import') === '1'

  function closeImport() {
    const next = new URLSearchParams(searchParams)
    next.delete('import')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <MarketingHero />
      <Reveal>
        <WhySection />
      </Reveal>
      <Reveal delayMs={40}>
        <InsideSection />
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
