'use client'
import { useReveal } from '@/hooks/use-reveal'

export const MentorSpotlight = () => {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const inView = shown ? 'is-in' : ''

  return (
    <section
      aria-labelledby="mentor-heading"
      className="bg-gc-surface-2 border-gc-border border-y px-6 py-24 sm:px-10 sm:py-32"
    >
      <div
        ref={ref}
        className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.45fr_1fr] lg:items-end lg:gap-20"
      >
        <div>
          <h2 id="mentor-heading" className="sr-only">
            The AI mentor
          </h2>

          <p
            className={`gc-reveal ${inView} font-gc-mono text-gc-text-muted m-0 text-[13px]`}
          >
            you: why is this too slow?
          </p>

          <blockquote
            className={`gc-reveal ${inView} text-gc-text m-0 mt-4 text-[clamp(1.2rem,2.2vw,1.75rem)] leading-[1.3] font-semibold tracking-[-0.015em]`}
            style={{ '--gc-delay': 100 } as React.CSSProperties}
          >
            Your inner loop keeps re-checking pairs it has already seen. Store
            each value as you pass it, and the second lookup stops being a
            search.
          </blockquote>

          <p
            className={`gc-reveal ${inView} text-gc-text-muted mt-6 max-w-[54ch] text-[13.5px] leading-[1.65]`}
            style={{ '--gc-delay': 180 } as React.CSSProperties}
          >
            The mentor works from the code in your editor, so it can point at
            the line that costs you the runtime. It will not hand over a
            finished answer.
          </p>
        </div>

        <dl
          className={`gc-reveal ${inView} border-gc-border m-0 border-t pt-8 lg:pt-10`}
          style={{ '--gc-delay': 240 } as React.CSSProperties}
        >
          <dt className="font-gc-mono text-gc-text-dim m-0 text-[11px] tracking-[0.08em] uppercase">
            Time complexity
          </dt>
          <dd className="font-gc-mono m-0 mt-3 flex items-baseline gap-3 text-[22px] leading-none font-bold sm:text-[26px]">
            <span className="text-gc-text-dim line-through decoration-2">
              O(n²)
            </span>
            <span aria-hidden="true" className="text-gc-text-dim text-[20px]">
              →
            </span>
            <span className="text-gc-success">O(n)</span>
          </dd>
          <dd className="text-gc-text-muted m-0 mt-4 text-[13px] leading-[1.6]">
            Complexity is read back from the solution you actually wrote, then
            attached to the submission.
          </dd>
        </dl>
      </div>
    </section>
  )
}
