import Link from 'next/link'
import { Logo } from '@/components/branding/Logo'

const FOOTER_LINKS = [
  { href: '/problems', label: 'Problems' },
  { href: '/trending', label: 'Trending' },
]

export const Footer = () => (
  <footer className="border-gc-border border-t px-6 py-12 sm:px-10">
    <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
      <div>
        <Logo size={22} />
        <p className="text-gc-text-muted mt-3 max-w-[34ch] text-[13px] leading-[1.6]">
          Algorithm practice that leaves something behind.
        </p>
      </div>

      <nav
        aria-label="Footer"
        className="text-gc-text-muted flex flex-wrap gap-x-7 gap-y-3 text-[13px]"
      >
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-gc-text no-underline transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://github.com/JakubPawinski/GitCode.dev"
          target="_blank"
          rel="noreferrer"
          className="hover:text-gc-text no-underline transition-colors"
        >
          Source
        </a>
      </nav>
    </div>
  </footer>
)
