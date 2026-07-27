import { Hero } from '@/components/landing/Hero'
import { CommitLedger } from '@/components/landing/CommitLedger'
import { FeatureBento } from '@/components/landing/FeatureBento'
import { MentorSpotlight } from '@/components/landing/MentorSpotlight'
import { ClosingCta } from '@/components/landing/ClosingCta'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <div className="bg-gc-bg text-gc-text font-gc-sans w-full">
      <main>
        <Hero />
        <CommitLedger />
        <FeatureBento />
        <MentorSpotlight />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  )
}
