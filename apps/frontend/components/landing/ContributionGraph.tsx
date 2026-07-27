'use client'
import { useMemo } from 'react'

const WEEKS = 53
const DAYS = 7
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const LEVEL_FILL = [
  'var(--surface-2)',
  'color-mix(in srgb, var(--accent) 26%, transparent)',
  'color-mix(in srgb, var(--accent) 48%, transparent)',
  'color-mix(in srgb, var(--accent) 70%, transparent)',
  'var(--accent)',
]

/** mulberry32: tiny deterministic PRNG. A fixed seed keeps the server and
 *  client render byte-identical, so this graph server-renders cleanly with no
 *  hydration mismatch and no post-mount layout shift. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Shapes a year that reads like a real developer's: quieter at weekends, a
 *  few dead weeks, and streaks that build, rather than uniform noise. */
function buildYear(seed: number) {
  const random = mulberry32(seed)
  const cells: number[] = []
  let streak = 0

  for (let week = 0; week < WEEKS; week++) {
    const quietWeek = random() < 0.13
    const momentum = Math.min(1, week / WEEKS + 0.3)

    for (let day = 0; day < DAYS; day++) {
      const isWeekend = day === 0 || day === 6
      let chance = momentum * (isWeekend ? 0.36 : 0.8)
      if (quietWeek) chance *= 0.16
      if (streak > 0) chance += 0.15

      if (random() > chance) {
        streak = 0
        cells.push(0)
        continue
      }

      streak += 1
      const intensity = random() + Math.min(streak, 5) * 0.09
      cells.push(
        intensity > 1.06 ? 4 : intensity > 0.8 ? 3 : intensity > 0.46 ? 2 : 1
      )
    }
  }

  return cells
}

type ContributionGraphProps = {
  /** 0 to 1. How much of the year has been revealed so far. */
  revealRatio?: number
  seed?: number
  repo?: string
}

export const ContributionGraph = ({
  revealRatio = 1,
  seed = 20260727,
  repo = 'your-username/algorithms',
}: ContributionGraphProps) => {
  const cells = useMemo(() => buildYear(seed), [seed])
  const litColumns = Math.round(Math.min(1, Math.max(0, revealRatio)) * WEEKS)
  const commits = useMemo(
    () =>
      cells.filter((level, i) => level > 0 && Math.floor(i / DAYS) < litColumns)
        .length,
    [cells, litColumns]
  )

  return (
    <figure
      className="border-gc-border bg-gc-surface m-0 rounded-2xl border p-5 sm:p-6"
      style={{ boxShadow: '0 40px 90px -45px rgba(139,92,246,0.5)' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-gc-mono text-gc-text text-[13px] font-semibold">
          {repo}
        </span>
        <span className="font-gc-mono text-gc-accent text-[12px] tabular-nums">
          {commits} commits
        </span>
      </div>

      <div
        className="mt-5"
        role="img"
        aria-label={`Contribution graph for ${repo}, filling to ${commits} commits as the page is read.`}
      >
        <div
          aria-hidden="true"
          className="font-gc-mono text-gc-text-dim mb-1.5 flex justify-between text-[9px]"
        >
          {MONTHS.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="grid gap-[3px]"
          style={{
            gridTemplateRows: `repeat(${DAYS}, 1fr)`,
            gridAutoFlow: 'column',
            gridAutoColumns: '1fr',
          }}
        >
          {cells.map((level, i) => {
            const column = Math.floor(i / DAYS)
            return (
              <span
                key={i}
                className={`gc-cell aspect-square w-full rounded-[2px] ${
                  column < litColumns ? 'is-lit' : ''
                }`}
                style={
                  {
                    '--gc-fill': LEVEL_FILL[level],
                    '--gc-col': column % 12,
                  } as React.CSSProperties
                }
              />
            )
          })}
        </div>
      </div>

      <figcaption className="border-gc-border text-gc-text-dim mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[11px]">
        <span>A year of practice, kept</span>
        <span aria-hidden="true" className="flex items-center gap-1.5">
          Less
          {LEVEL_FILL.map((fill, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ background: fill }}
            />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  )
}
