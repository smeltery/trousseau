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

export function MarketingPage() {
  return (
    <div>
      <MarketingHero />
      <WhySection />
      <InsideSection />
      <HowSection />
      <YoursSection />
      <PrivacySection />
      <BackupSection />
      <QuestionsSection />
      <BeginSection />
      <MarketingFooter />
    </div>
  )
}
