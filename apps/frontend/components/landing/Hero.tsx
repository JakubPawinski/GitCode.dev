'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useTheme } from '@/contexts/theme/ThemeContext'
<<<<<<< Updated upstream
=======
import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { useReveal } from '@/hooks/use-reveal'
>>>>>>> Stashed changes
import { FaultyTerminal } from '@/components/effects/FaultyTerminal'

export const Hero = () => {
  const { data } = useAuth()
  const { theme } = useTheme()
  const { ref, shown } = useReveal<HTMLDivElement>()
  const isDark = theme === 'dark'
  const inView = shown ? 'is-in' : ''

<<<<<<< Updated upstream
  useEffect(() => {
    setCellsByYear({
      2026: generateActivityCells(),
      2025: generateActivityCells(),
      2024: generateActivityCells(),
    })
  }, [])

  const cells = useMemo(() => cellsByYear?.[year] ?? [], [cellsByYear, year])
  const primaryCtaHref = data ? '/problems' : '/login'
=======
  const ctaClass =
    'gc-glass-accent inline-flex h-11 items-center rounded-full px-6 text-[14px] font-bold text-white'
>>>>>>> Stashed changes

  return (
    <section
      aria-label="Introduction"
      className="relative flex min-h-[calc(100dvh-3.5rem)] items-center overflow-hidden px-6 pt-16 pb-20 sm:px-10 lg:pt-20"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ opacity: isDark ? 0.45 : 0.3 }}
      >
        <FaultyTerminal
          tint={isDark ? '#8b5cf6' : '#7c3aed'}
          scale={2.6}
          digitSize={1.1}
          scanlineIntensity={0.4}
          glitchAmount={0.7}
          flickerAmount={0.7}
          noiseAmp={0.85}
          curvature={0}
          mouseReact
          mouseStrength={0.35}
          brightness={isDark ? 0.8 : 0.7}
          pageLoadAnimation
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${
            isDark ? 'rgba(5,5,7,0.3)' : 'rgba(250,249,252,0.42)'
          }, var(--bg) 95%)`,
        }}
      />

<<<<<<< Updated upstream
      <div className="gc-hero-grid relative mx-auto grid w-full max-w-6xl [grid-template-columns:0.85fr_1.15fr] items-center gap-9">
        <div>
          <div className="text-gc-text-muted font-gc-mono border-gc-border mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold tracking-[0.08em] uppercase">
            <span
              className="gc-pulse bg-gc-success h-1.5 w-1.5 rounded-full"
              aria-hidden="true"
            />
            <span>Now with AI mentor</span>
          </div>
          <h1 className="text-gc-text m-0 text-[32px] leading-[1.3] font-bold tracking-[-0.015em] sm:text-[38px]">
            A platform that turns coding challenges into your real GitHub{' '}
            <span className="text-gc-accent">portfolio.</span>
          </h1>
          <p className="text-gc-text-muted mt-5 max-w-[460px] text-[15.5px] leading-[1.7]">
            GitCode.dev bridges the gap between learning algorithms and building
            a professional presence. Every accepted solution syncs automatically
            to your GitHub repository.
          </p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <Link
              href={primaryCtaHref}
              className="gc-glass-accent inline-flex h-12 items-center rounded-full px-7 text-[14.5px] font-bold text-white"
            >
              Start Your Journey
            </Link>
            <a
              href="#features"
              className="gc-glass text-gc-text inline-flex h-12 items-center rounded-full px-7 text-[14.5px] font-semibold"
            >
              How it works
            </a>
          </div>
        </div>
=======
      <div ref={ref} className="relative mx-auto w-full max-w-[1400px]">
        <h1
          className={`gc-reveal ${inView} text-gc-text m-0 max-w-[18ch] text-[clamp(2.1rem,4.4vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.035em]`}
        >
          You solved it.
          <br />
          <span className="text-gc-accent gc-vanish inline-block pb-2">
            Then it was gone.
          </span>
        </h1>

        <p
          className={`gc-reveal ${inView} text-gc-text-muted mt-6 max-w-[50ch] text-[15.5px] leading-[1.65] sm:text-[16.5px]`}
          style={{ '--gc-delay': 140 } as React.CSSProperties}
        >
          Practice normally leaves nothing behind. GitCode judges your solution,
          reviews how you got there, and commits it to your own GitHub.
        </p>
>>>>>>> Stashed changes

        <div
          className={`gc-reveal ${inView} mt-8 flex flex-wrap items-center gap-3`}
          style={{ '--gc-delay': 260 } as React.CSSProperties}
        >
          {data ? (
            <Link href="/problems" className={ctaClass}>
              Start solving
            </Link>
          ) : (
            <button
              type="button"
              onClick={getLoginRedirect}
              className={ctaClass}
            >
              Start solving
            </button>
          )}
          <a
            href="#ledger-heading"
            className="gc-glass text-gc-text inline-flex h-11 items-center rounded-full px-6 text-[14px] font-semibold"
          >
            See what it leaves behind
          </a>
        </div>
      </div>
    </section>
  )
}
