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
import { Reveal } from '../components/Reveal'

export function MarketingPage() {
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
    </div>
  )
}
