'use client'
import type { PointerEvent } from 'react'
import { Box, GitBranch, History, Sparkles } from 'lucide-react'
import { useReveal } from '@/hooks/use-reveal'

const CARD =
  'gc-spot border-gc-border bg-gc-surface relative overflow-hidden rounded-2xl border p-6 sm:p-7'

/** Writes the cursor position straight onto the node so the highlight can
 *  follow it in CSS. Deliberately not React state: this fires on every
 *  pointermove and must not re-render the tree. */
const trackPointer = (event: PointerEvent<HTMLElement>) => {
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  el.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

export const FeatureBento = () => {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const inView = shown ? 'is-in' : ''
  const delay = (ms: number) => ({ '--gc-delay': ms }) as React.CSSProperties

  return (
    <section
      aria-labelledby="build-heading"
      className="px-6 py-24 sm:px-10 sm:py-32"
    >
      <div ref={ref} className="mx-auto max-w-[1180px]">
        <h2
          id="build-heading"
          className={`gc-reveal ${inView} text-gc-text m-0 max-w-[18ch] text-[clamp(1.6rem,2.8vw,2.25rem)] leading-[1.15] font-extrabold tracking-[-0.02em]`}
        >
          What the squares are actually made of.
        </h2>

        <div className="mt-14 grid gap-4 lg:grid-cols-6 lg:gap-5">
          <article
            onPointerMove={trackPointer}
            className={`${CARD} gc-reveal ${inView} flex flex-col justify-between lg:col-span-4 lg:row-span-2`}
            style={{
              ...delay(0),
              background:
                'linear-gradient(150deg, color-mix(in srgb, var(--accent) 16%, var(--surface)), var(--surface) 62%)',
            }}
          >
            <div className="relative">
              <GitBranch className="text-gc-accent" size={22} />
              <h3 className="text-gc-text mt-4 mb-0 text-[19px] leading-tight font-bold tracking-[-0.01em] sm:text-[21px]">
                Accepted solutions become commits
              </h3>
              <p className="text-gc-text-muted mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.65]">
                GitCode creates the repository, writes the commit, and pushes it
                under your account. The history is yours to keep, and it stays
                readable to anyone who opens it.
              </p>
            </div>

            <div className="border-gc-border relative mt-8 rounded-xl border bg-[var(--bg)] px-4 py-3.5">
              <code className="font-gc-mono block text-[12.5px] leading-relaxed">
                <span className="text-gc-text-dim">a3f19c2</span>{' '}
                <span className="text-gc-text">
                  feat(two-sum): add O(n) hash map solution
                </span>
              </code>
              <code className="font-gc-mono text-gc-text-muted mt-1.5 block text-[12.5px]">
                <span className="text-gc-success">+18</span>{' '}
                <span className="text-gc-text-dim">-0</span> · javascript
              </code>
            </div>
          </article>

          <article
            onPointerMove={trackPointer}
            className={`${CARD} gc-reveal ${inView} lg:col-span-2`}
            style={{
              ...delay(80),
              background:
                'linear-gradient(200deg, var(--accent-soft), var(--surface) 70%)',
            }}
          >
            <span className="relative block">
              <Sparkles className="text-gc-accent" size={20} />
              <h3 className="text-gc-text mt-4 mb-0 text-[16px] leading-tight font-bold">
                A mentor that reads the code
              </h3>
              <p className="text-gc-text-muted mt-2 text-[13.5px] leading-[1.6]">
                Hints scoped to your actual approach, not a generic walkthrough
                of the answer.
              </p>
            </span>
          </article>

          <article
            onPointerMove={trackPointer}
            className={`${CARD} gc-reveal ${inView} lg:col-span-2`}
            style={delay(140)}
          >
            <span
              aria-hidden="true"
              className="gc-dotgrid pointer-events-none absolute inset-0 opacity-50"
            />
            <span className="relative block">
              <Box className="text-gc-accent" size={20} />
              <h3 className="text-gc-text mt-4 mb-0 text-[16px] leading-tight font-bold">
                Judged in a real sandbox
              </h3>
              <p className="text-gc-text-muted mt-2 text-[13.5px] leading-[1.6]">
                Submissions run in an isolated container against the full test
                suite, not a lint pass.
              </p>
            </span>
          </article>

          <article
            onPointerMove={trackPointer}
            className={`${CARD} gc-reveal ${inView} flex items-center justify-between gap-6 lg:col-span-3`}
            style={delay(200)}
          >
            <div className="relative">
              <h3 className="text-gc-text m-0 text-[16px] leading-tight font-bold">
                Two languages, done properly
              </h3>
              <p className="text-gc-text-muted mt-2 max-w-[30ch] text-[13.5px] leading-[1.6]">
                Full editor tooling for both, rather than a long list of
                half-supported runtimes.
              </p>
            </div>
            <span
              aria-hidden="true"
              className="font-gc-mono text-gc-text-dim relative flex flex-none flex-col items-end text-[22px] leading-none font-bold sm:text-[26px]"
            >
              <span>JS</span>
              <span className="text-gc-accent mt-1">PY</span>
            </span>
          </article>

          <article
            onPointerMove={trackPointer}
            className={`${CARD} gc-reveal ${inView} lg:col-span-3`}
            style={delay(260)}
          >
            <span className="relative block">
              <History className="text-gc-accent" size={20} />
              <h3 className="text-gc-text mt-4 mb-0 text-[16px] leading-tight font-bold">
                Every attempt is kept
              </h3>
              <p className="text-gc-text-muted mt-2 max-w-[42ch] text-[13.5px] leading-[1.6]">
                Runtime, test results, and the code you shipped stay on the
                submission, so you can see how an approach changed over time.
              </p>
            </span>
          </article>
        </div>
      </div>
    </section>
  )
}
