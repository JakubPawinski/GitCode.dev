const FEATURES = [
  {
    title: 'GitHub Sync',
    description:
      'Solutions sync automatically to your repository, building a continuous activity graph.',
    stat: '1,200+ repos synced',
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      >
        <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 3.2 5.4 3.5 5.4 3.5a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V22" />
      </svg>
    ),
  },
  {
    title: 'AI Mentorship',
    description:
      'Real-time feedback, algorithmic hints, and complexity analysis as you type.',
    stat: '24/7 availability',
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      >
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: 'Verifiable Portfolio',
    description:
      'Turn practice into a verifiable track record recruiters can actually see.',
    stat: '38k developers',
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      >
        <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.4 6L7 15.4M17 15.4l1.4 5.6" />
      </svg>
    ),
  },
]

export const FeatureTimeline = () => (
  <section
    id="features"
    aria-label="Key features"
    className="px-6 py-20 sm:px-10 sm:py-24"
  >
    <div className="mx-auto max-w-2xl">
      <div className="mb-12 text-center">
        <div className="text-gc-accent font-gc-mono text-[11px] font-bold tracking-[0.1em] uppercase">
          Why GitCode.dev
        </div>
        <h2 className="text-gc-text mt-3 text-[26px] font-extrabold tracking-[-0.02em] sm:text-[30px]">
          Everything you need to prove your skill
        </h2>
      </div>

      <div className="relative pl-11">
        <div
          aria-hidden="true"
          className="bg-gc-border absolute top-1.5 bottom-1.5 left-3.5 w-0.5"
        />

        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className={`relative text-left ${i < FEATURES.length - 1 ? 'pb-13' : ''}`}
          >
            <span
              aria-hidden="true"
              className="gc-dot-ring bg-gc-accent absolute top-0 -left-11 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ boxShadow: '0 0 0 4px var(--accent-soft)' }}
            >
              {feature.icon}
            </span>
            <h3 className="text-gc-text m-0 mt-0.5 text-[17px] font-bold">
              {feature.title}
            </h3>
            <p className="text-gc-text-muted mt-2 max-w-[520px] text-sm leading-[1.65]">
              {feature.description}
            </p>
            <div className="text-gc-accent font-gc-mono mt-3 text-[11px] font-bold">
              {feature.stat}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)
