type LogoProps = {
  size?: number
  withWordmark?: boolean
}

export const Logo = ({ size = 26, withWordmark = true }: LogoProps) => (
  <span className="inline-flex items-center gap-2">
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="25"
        height="25"
        rx="7"
        fill="var(--bg)"
        stroke="var(--border-hover)"
      />
      <path
        d="M8 8.5 4.5 13l3.5 4.5"
        stroke="var(--accent)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8.5 21.5 13 18 17.5"
        stroke="var(--accent)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="13" r="2.1" fill="var(--focus)" />
    </svg>
    {withWordmark && (
      <span className="font-gc-mono text-gc-text text-base font-bold tracking-tight">
        git<span className="text-gc-accent">code</span>
      </span>
    )}
  </span>
)
