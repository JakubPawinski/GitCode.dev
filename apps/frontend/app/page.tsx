import { Hero } from '@/components/landing/Hero'
import { FeatureTimeline } from '@/components/landing/FeatureTimeline'
import { WorkspaceShowcase } from '@/components/landing/WorkspaceShowcase'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <div className="bg-gc-bg text-gc-text font-gc-sans w-full">
      <Hero />
      <FeatureTimeline />
      <WorkspaceShowcase />
      <Footer />
    </div>
  )
}
