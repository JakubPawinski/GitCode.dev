'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth/AuthContext'
import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { useReveal } from '@/hooks/use-reveal'

export const ClosingCta = () => {
  const { data } = useAuth()
  const { ref, shown } = useReveal<HTMLDivElement>()
  const inView = shown ? 'is-in' : ''

  const ctaClass =
    'gc-glass-accent inline-flex h-11 items-center rounded-full px-7 text-[14px] font-bold text-white'

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden px-6 py-28 text-center sm:px-10 sm:py-36"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        style={{
          background:
            'radial-gradient(circle, var(--accent-soft), transparent 70%)',
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-[820px]">
        <h2
          id="cta-heading"
          className={`gc-reveal ${inView} text-gc-text m-0 text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.12] font-extrabold tracking-[-0.025em]`}
        >
          Pick a problem. The commit takes care of itself.
        </h2>

        <div
          className={`gc-reveal ${inView} mt-9 flex justify-center`}
          style={{ '--gc-delay': 120 } as React.CSSProperties}
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
        </div>
      </div>
    </section>
  )
}
