import Link from 'next/link'
import { Logo } from '@/components/branding/Logo'

const FOOTER_LINKS = [
  { href: '/problems', label: 'Problems' },
  { href: '/trending', label: 'Trending' },
]

export const Footer = () => (
  <footer className="border-gc-border flex flex-col items-start justify-between gap-6 border-t px-6 py-8 sm:flex-row sm:px-10">
    <div>
      <Logo size={22} />
      <p className="text-gc-text-dim mt-2 text-[13px]">
        Build your future, one commit at a time.
      </p>
    </div>
    <nav
      aria-label="Footer"
      className="text-gc-text-muted flex gap-6 text-[13px]"
    >
      {FOOTER_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-gc-text-muted no-underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  </footer>
)
