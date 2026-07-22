'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useTheme } from '@/contexts/theme/ThemeContext'
import { FaultyTerminal } from '@/components/effects/FaultyTerminal'

const YEARS = [2026, 2025, 2024] as const
const MONTH_LABELS = [
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
const COMMIT_COUNTS: Record<number, number> = {
  2026: 312,
  2025: 481,
  2024: 226,
}
const ACTIVITY_COLORS = [
  'rgba(139,92,246,0.08)',
  'rgba(139,92,246,0.22)',
  'rgba(139,92,246,0.42)',
  'rgba(139,92,246,0.65)',
  '#8b5cf6',
]

type ActivityCell = { color: string }

function generateActivityCells(): ActivityCell[] {
  return Array.from({ length: 371 }, () => ({
    color: ACTIVITY_COLORS[Math.floor(Math.random() * ACTIVITY_COLORS.length)],
  }))
}

export const Hero = () => {
  const { data } = useAuth()
  const { theme } = useTheme()
  const [year, setYear] = useState<(typeof YEARS)[number]>(2026)
  // Cell colors are randomized decoration — generated client-side after mount
  // so the server-rendered markup and the first client render always match.
  const [cellsByYear, setCellsByYear] = useState<Record<
    number,
    ActivityCell[]
  > | null>(null)

  useEffect(() => {
    setCellsByYear({
      2026: generateActivityCells(),
      2025: generateActivityCells(),
      2024: generateActivityCells(),
    })
  }, [])

  const cells = useMemo(() => cellsByYear?.[year] ?? [], [cellsByYear, year])
  const primaryCtaHref = data ? '/problems' : '/login'

  return (
    <section
      aria-label="Introduction"
      className="gc-hero-section relative box-border flex min-h-screen items-center overflow-hidden px-6 py-10 sm:px-10"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ opacity: theme === 'dark' ? 0.5 : 0.35 }}
      >
        <FaultyTerminal
          tint={theme === 'dark' ? '#8b5cf6' : '#7c3aed'}
          scale={2.4}
          digitSize={1.1}
          scanlineIntensity={0.4}
          glitchAmount={0.6}
          flickerAmount={0.6}
          noiseAmp={0.8}
          curvature={0}
          mouseReact
          mouseStrength={0.3}
          brightness={theme === 'dark' ? 0.8 : 0.7}
          pageLoadAnimation
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${
            theme === 'dark' ? 'rgba(5,5,7,0.2)' : 'rgba(250,249,252,0.3)'
          }, var(--bg) 92%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-15 right-[10%] h-[520px] w-[520px] rounded-full blur-[30px]"
        style={{
          background:
            'radial-gradient(circle, var(--accent-soft), transparent 70%)',
        }}
      />

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

        <div
          role="img"
          aria-label="Code editor showing a JavaScript twoSum solution being committed and pushed to GitHub"
          className="border-gc-border bg-gc-surface relative overflow-hidden rounded-2xl border"
          style={{ boxShadow: '0 40px 100px -30px rgba(139,92,246,0.4)' }}
        >
          <span
            className="gc-corner"
            aria-hidden="true"
            style={{
              top: '-1px',
              left: '-1px',
              borderTop: '2px solid',
              borderLeft: '2px solid',
              borderRadius: '14px 0 0 0',
            }}
          />
          <span
            className="gc-corner"
            aria-hidden="true"
            style={{
              bottom: '-1px',
              right: '-1px',
              borderBottom: '2px solid',
              borderRight: '2px solid',
              borderRadius: '0 0 14px 0',
            }}
          />
          <div className="border-gc-border flex items-center justify-between border-b px-4 py-3">
            <div className="flex gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: '#ff6169' }}
              />
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: '#ffbd44' }}
              />
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: '#00ca4e' }}
              />
            </div>
            <span className="text-gc-text-dim font-gc-mono text-[11px]">
              solution.js
            </span>
          </div>
          <div className="font-gc-mono px-5.5 pt-5.5 pb-4.5 text-[12.5px] leading-[1.85]">
            <div>
              <span className="text-gc-focus">function</span> twoSum(nums,
              target) {'{'}
            </div>
            <div className="pl-4.5">
              <span className="text-gc-focus">const</span> map ={' '}
              <span className="text-gc-focus">new</span> Map();
            </div>
            <div className="pl-4.5">
              <span className="text-gc-focus">for</span> (
              <span className="text-gc-focus">let</span> i = 0; i &lt;
              nums.length; i++) {'{'}
            </div>
            <div className="pl-9">
              <span className="text-gc-focus">const</span> complement = target -
              nums[i];
            </div>
            <div className="pl-9">
              <span className="text-gc-focus">if</span> (map.has(complement)){' '}
              {'{'}
            </div>
            <div className="pl-[54px]">
              <span className="text-gc-focus">return</span>{' '}
              [map.get(complement), i];
            </div>
            <div className="pl-9">{'}'}</div>
            <div className="pl-4.5">map.set(nums[i], i);</div>
            <div className="pl-4.5">{'}'}</div>
            <div>{'}'}</div>
            <div className="text-gc-text-dim mt-2.5">
              // AI: Efficient O(n) solution achieved.
            </div>
          </div>
          <div className="border-gc-border bg-gc-bg border-t">
            <div className="flex items-center gap-1.5 px-5.5 pt-2.5">
              <span className="bg-gc-success h-1.5 w-1.5 rounded-full" />
              <span className="text-gc-text-dim font-gc-mono text-[9px] tracking-[0.08em] uppercase">
                Terminal
              </span>
            </div>
            <div className="font-gc-mono px-5.5 pt-2 pb-4 text-xs leading-[1.8]">
              <div>
                <span className="text-gc-accent">❯</span>{' '}
                <span className="text-gc-text-muted">
                  git commit -m &quot;feat: implement optimized twoSum&quot;
                </span>
              </div>
              <div>
                <span className="text-gc-accent">❯</span>{' '}
                <span className="text-gc-text-muted">git push origin main</span>
              </div>
              <div className="text-gc-success">
                ✓ synced to github.com/you/algorithms
              </div>
            </div>
          </div>
          <div className="border-gc-border border-t px-5 pt-3 pb-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-gc-text-dim font-gc-mono text-[9px] tracking-[0.08em] uppercase">
                Activity
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-gc-text-dim font-gc-mono text-[9px]">
                  {COMMIT_COUNTS[year]} commits
                </span>
                <div
                  role="tablist"
                  aria-label="Activity year"
                  className="flex gap-0.5"
                >
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      role="tab"
                      aria-selected={year === y}
                      onClick={() => setYear(y)}
                      className={`gc-yearbtn font-gc-mono rounded px-2 py-1 text-[9px] font-bold ${
                        year === y
                          ? 'bg-gc-accent text-white'
                          : 'text-gc-text-dim bg-transparent'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div
                aria-hidden="true"
                className="font-gc-mono text-gc-text-dim mb-1 flex gap-[3px] pl-4 text-[8px]"
              >
                {MONTH_LABELS.map((m) => (
                  <span key={m} className="flex-none">
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                <div
                  aria-hidden="true"
                  className="font-gc-mono text-gc-text-dim flex w-[13px] flex-none flex-col justify-between gap-0.5 text-[7px]"
                >
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>
                <div
                  aria-hidden="true"
                  className="grid gap-0.5"
                  style={{
                    gridTemplateRows: 'repeat(7, 1fr)',
                    gridAutoFlow: 'column',
                    gridAutoColumns: '9px',
                  }}
                >
                  {(cells.length ? cells : Array.from({ length: 371 })).map(
                    (cell, i) => (
                      <span
                        key={i}
                        className="h-[9px] w-[9px] rounded-sm"
                        style={{
                          background:
                            (cell as ActivityCell)?.color ?? 'var(--surface-2)',
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
