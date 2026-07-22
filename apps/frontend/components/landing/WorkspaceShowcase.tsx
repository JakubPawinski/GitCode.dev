'use client'
import { useState } from 'react'
import Link from 'next/link'

type Tab = 'description' | 'hints' | 'analysis'

const TABS: { id: Tab; label: string }[] = [
  { id: 'description', label: 'Description' },
  { id: 'hints', label: 'Hints' },
  { id: 'analysis', label: 'AI Analysis' },
]

const tabClass = (active: boolean) =>
  `font-gc-mono rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-[0.02em] ${
    active ? 'bg-gc-accent text-white' : 'text-gc-text-muted bg-transparent'
  }`

export const WorkspaceShowcase = () => {
  const [tab, setTab] = useState<Tab>('description')

  return (
    <>
      <section
        aria-labelledby="workspace-h"
        className="px-6 pt-24 text-center sm:px-10 sm:pt-28"
      >
        <h2
          id="workspace-h"
          className="text-gc-text m-0 text-[32px] font-extrabold tracking-[-0.02em] sm:text-[40px]"
        >
          The Workspace
        </h2>
        <p className="text-gc-text-muted mx-auto mt-3.5 max-w-[480px] text-[15px]">
          A fully-featured IDE experience tailored for mastering algorithms,
          completely integrated.
        </p>
      </section>

      <section
        aria-label="Workspace demo"
        className="px-6 pt-12 pb-24 sm:px-10 sm:pb-32"
      >
        <div
          className="border-gc-border bg-gc-surface mx-auto max-w-[1360px] overflow-hidden rounded-2xl border"
          style={{ boxShadow: '0 50px 120px -30px rgba(139,92,246,0.35)' }}
        >
          <div className="border-gc-border flex items-center justify-between border-b px-4.5 py-3">
            <div className="flex items-center gap-3.5">
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
              <span className="text-gc-text-muted font-gc-mono text-xs">
                Two Sum
              </span>
            </div>
            <div className="flex gap-4.5">
              <Link
                href="/problems"
                className="gc-glass text-gc-text inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-[13px] font-semibold"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run
              </Link>
              <Link
                href="/problems"
                className="gc-glass-accent inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-[13px] font-bold text-white"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Submit
              </Link>
            </div>
          </div>

          <div className="grid min-h-[460px] grid-cols-1 lg:[grid-template-columns:1fr_1.4fr_0.9fr]">
            <div className="border-gc-border border-b lg:border-r lg:border-b-0">
              <div
                role="tablist"
                aria-label="Problem panel"
                className="border-gc-border flex gap-1 border-b px-4.5 py-3"
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={tabClass(tab === t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'description' && (
                <div className="p-5">
                  <h4 className="text-gc-text m-0 text-[15px] font-bold">
                    1. Two Sum
                  </h4>
                  <div className="mt-3 flex gap-1.5">
                    <span
                      className="font-gc-mono text-gc-success rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{ background: 'rgba(61,220,151,0.12)' }}
                    >
                      Easy
                    </span>
                    <span className="font-gc-mono text-gc-text-muted bg-gc-surface-2 rounded-full px-2.5 py-0.5 text-[11px]">
                      Array
                    </span>
                    <span className="font-gc-mono text-gc-text-muted bg-gc-surface-2 rounded-full px-2.5 py-0.5 text-[11px]">
                      Hash Table
                    </span>
                  </div>
                  <p className="text-gc-text-muted mt-4 text-[13px] leading-[1.7]">
                    Given an array of integers nums and an integer target,
                    return indices of the two numbers such that they add up to
                    target.
                  </p>
                  <p className="text-gc-text-muted mt-3 text-[13px] leading-[1.7]">
                    You may assume each input has exactly one solution, and may
                    not use the same element twice.
                  </p>
                </div>
              )}

              {tab === 'hints' && (
                <div className="flex flex-col gap-3 p-5">
                  {[
                    'A brute-force nested loop checks every pair — that’s O(n²).',
                    'Store each number you’ve seen in a Hash Map as you iterate once.',
                    'For each number, check if target minus that number is already in the map.',
                  ].map((hint, i) => (
                    <div key={hint} className="flex gap-2.5">
                      <span className="font-gc-mono text-gc-accent text-xs font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-gc-text-muted m-0 text-[13px] leading-[1.7]">
                        {hint}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'analysis' && (
                <div className="flex flex-col gap-3.5 p-5">
                  <div className="border-gc-border flex items-center justify-between rounded-[10px] border px-3.5 py-2.5">
                    <span className="text-gc-text-muted text-[12.5px]">
                      Time complexity
                    </span>
                    <span className="font-gc-mono text-gc-success text-[13px] font-bold">
                      O(n)
                    </span>
                  </div>
                  <div className="border-gc-border flex items-center justify-between rounded-[10px] border px-3.5 py-2.5">
                    <span className="text-gc-text-muted text-[12.5px]">
                      Space complexity
                    </span>
                    <span className="font-gc-mono text-gc-success text-[13px] font-bold">
                      O(n)
                    </span>
                  </div>
                  <p className="text-gc-text-muted m-0 text-[12.5px] leading-[1.7]">
                    A single pass with a Hash Map avoids the nested loop,
                    trading a little memory for linear runtime.
                  </p>
                </div>
              )}
            </div>

            <div className="border-gc-border flex flex-col border-b lg:border-r lg:border-b-0">
              <div className="border-gc-border font-gc-mono text-gc-text-muted flex gap-4.5 border-b px-5 py-3 text-xs">
                <span className="text-gc-text">solution.js</span>
                <span>test_cases.json</span>
              </div>
              <div className="font-gc-mono text-gc-text-muted flex-1 px-5 py-4.5 text-[12.5px] leading-[1.85]">
                <div>/**</div>
                <div>&nbsp;* @param {'{number[]}'} nums</div>
                <div>&nbsp;* @param {'{number}'} target</div>
                <div>&nbsp;* @return {'{number[]}'}</div>
                <div>&nbsp;*/</div>
                <div className="bg-gc-accent-soft border-gc-accent text-gc-text -ml-6 border-l-2 pl-5.5">
                  <span className="text-gc-focus">function</span> solve(nums,
                  target) {'{'}
                </div>
                <div className="text-gc-text pl-4.5">// Your logic here...</div>
                <div className="text-gc-text">{'}'}</div>
              </div>
              <div className="border-gc-border bg-gc-bg mt-auto border-t">
                <div className="flex items-center gap-1.5 px-5 pt-2.5">
                  <span className="bg-gc-success h-1.5 w-1.5 rounded-full" />
                  <span className="text-gc-text-dim font-gc-mono text-[9px] tracking-[0.08em] uppercase">
                    Terminal
                  </span>
                </div>
                <div className="font-gc-mono px-5 pt-2 pb-4 text-xs leading-[1.8]">
                  <div>
                    <span className="text-gc-accent">❯</span>{' '}
                    <span className="text-gc-text-muted">
                      node solution.js --test
                    </span>
                  </div>
                  <div className="text-gc-success">
                    ✓ 47/47 test cases passed
                  </div>
                  <div className="text-gc-text-dim">
                    Runtime: 62ms · Beats 94% of submissions
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="border-gc-border text-gc-text-muted flex items-center gap-2 border-b px-5 py-3 text-xs">
                <span
                  className="gc-pulse bg-gc-success h-1.5 w-1.5 rounded-full"
                  aria-hidden="true"
                />
                Mentor Active
              </div>
              <div className="flex flex-col gap-3 p-4.5">
                <div className="bg-gc-surface-2 text-gc-text-muted rounded-[10px] px-3.5 py-3 text-[12.5px] leading-[1.6]">
                  I noticed you&apos;re starting Two Sum. A brute force nested
                  loop will be O(n²).
                </div>
                <div className="bg-gc-accent self-end rounded-[10px] px-3.5 py-2.5 text-[12.5px] text-white">
                  Can we do better?
                </div>
                <div className="border-gc-accent-soft bg-gc-accent-soft text-gc-text-muted rounded-[10px] border px-3.5 py-3 text-[12.5px] leading-[1.6]">
                  Yes! Use a Hash Map to store values you&apos;ve seen to reach
                  O(n) time complexity.
                </div>
                <div className="flex gap-2">
                  <div className="border-gc-border text-gc-text-dim flex h-8.5 flex-1 items-center rounded-lg border px-3 text-[11.5px]">
                    Ask for a hint...
                  </div>
                  <Link
                    href="/problems"
                    aria-label="Go to problems"
                    className="gc-glass-accent flex h-8.5 w-8.5 flex-none items-center justify-center rounded-lg"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M22 2 11 13M22 2 15 22l-4-9-9-4Z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
