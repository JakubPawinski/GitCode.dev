'use client'
import { useEffect, useState } from 'react'
import { ContributionGraph } from './ContributionGraph'

const BEATS = [
  {
    verb: 'solve',
    title: 'Open a problem, not a project',
    body: 'The editor is already configured. Write JavaScript or Python and run it without cloning anything.',
  },
  {
    verb: 'judge',
    title: 'Run against the real suite',
    body: 'Submissions execute in an isolated container against every test case, so a pass means it passed.',
  },
  {
    verb: 'review',
    title: 'Get read before you submit',
    body: 'The mentor points at the line that costs you the runtime and names the complexity you wrote.',
  },
  {
    verb: 'commit',
    title: 'It lands in your repository',
    body: 'GitCode writes the commit and pushes it under your account. The square fills, and it stays filled.',
  },
]

/** Paced to reading the step body rather than to a snappy demo loop. */
const ADVANCE_MS = 5500

export const CommitLedger = () => {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  // Gates the rail animation so it begins in the same tick as the interval
  // below. Starting it at first paint instead would let the sweep drift ahead
  // of the highlighted step by however long hydration took.
  const [started, setStarted] = useState(false)

  // Advances on its own so the graph fills without the reader doing anything,
  // and hands over control the moment they interact. Reduced-motion visitors
  // skip straight to the finished year.
  useEffect(() => {
    if (paused) return
    // Set before the reduced-motion branch: that path still needs the rail
    // marked as started, since the reduced-motion CSS pins it to full width
    // rather than leaving it empty.
    setStarted(true)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(BEATS.length - 1)
      return
    }
    const id = window.setInterval(
      () => setActive((current) => (current + 1) % BEATS.length),
      ADVANCE_MS
    )
    return () => window.clearInterval(id)
  }, [paused])

  // Only an explicit click hands control over. Hovering leaves the sweep
  // running, so moving the cursor across the row does not stall the page.
  const selectStep = (index: number) => {
    setPaused(true)
    setActive(index)
  }

  return (
    <section
      aria-labelledby="ledger-heading"
      className="border-gc-border border-t px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="mx-auto max-w-[1180px]">
        <h2
          id="ledger-heading"
          className="text-gc-text m-0 max-w-[22ch] text-[clamp(1.6rem,2.8vw,2.25rem)] leading-[1.15] font-extrabold tracking-[-0.02em]"
        >
          Every accepted solution is one more square.
        </h2>

        <div className="mt-10">
          {/* Sweeps continuously from load over the full cycle. The step
              labels switch on the same interval, so a label lights up exactly
              as the fill crosses into its quarter. Once the reader takes over,
              the sweep is replaced by a discrete fill to their chosen step. */}
          <div
            aria-hidden="true"
            className="bg-gc-border relative h-[2px] w-full overflow-hidden"
          >
            {paused ? (
              <span
                className="bg-gc-accent absolute inset-y-0 left-0 block transition-[width] duration-500 ease-out"
                style={{ width: `${((active + 1) / BEATS.length) * 100}%` }}
              />
            ) : (
              <span
                className={`bg-gc-accent absolute inset-0 block origin-left ${
                  started ? 'gc-rail-fill' : 'scale-x-0'
                }`}
                style={
                  {
                    '--gc-total': `${BEATS.length * ADVANCE_MS}ms`,
                  } as React.CSSProperties
                }
              />
            )}
          </div>

          <ol
            className="m-0 flex snap-x snap-mandatory list-none gap-5 overflow-x-auto p-0 pt-6 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible"
            style={{ scrollbarWidth: 'none' }}
          >
            {BEATS.map((beat, i) => {
              const isActive = i === active
              return (
                <li
                  key={beat.verb}
                  className="min-w-[76%] snap-center sm:min-w-[46%] md:min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => selectStep(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className="group block w-full cursor-pointer text-left"
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span
                        className="font-gc-mono text-[11px] tabular-nums transition-colors duration-300"
                        style={{
                          color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="font-gc-mono text-[12px] font-bold transition-colors duration-300"
                        style={{
                          color: isActive
                            ? 'var(--accent)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {beat.verb}
                      </span>
                    </span>

                    <span
                      className="text-gc-text mt-2 block text-[16px] leading-[1.25] font-bold tracking-[-0.01em] transition-opacity duration-500 group-hover:opacity-100 sm:text-[17px]"
                      style={{ opacity: isActive ? 1 : 0.45 }}
                    >
                      {beat.title}
                    </span>

                    <span
                      className="text-gc-text-muted mt-2 block text-[13.5px] leading-[1.6] transition-opacity duration-500 group-hover:opacity-90"
                      style={{ opacity: isActive ? 1 : 0.35 }}
                    >
                      {beat.body}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="mx-auto mt-14 max-w-[760px]">
          <ContributionGraph revealRatio={(active + 1) / BEATS.length} />
        </div>
      </div>
    </section>
  )
}
