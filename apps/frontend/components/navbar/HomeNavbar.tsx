'use client'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth/AuthContext'
import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { Logo } from '@/components/branding/Logo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { NotificationBell } from '../notification/NotificationBell'
import { UserMenu } from './UserMenu'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/problems', label: 'Problems' },
  { href: '/trending', label: 'Trending' },
]

export const HomeNavbar = () => {
  const { problem } = useParams()
  const pathname = usePathname()
  const { data } = useAuth()

  if (problem) return null

  return (
    <nav
      aria-label="Primary"
      className="border-gc-border bg-gc-bg text-gc-text flex h-14 items-center gap-7 border-b px-6"
    >
      <Link href="/" className="flex-none">
        <Logo />
      </Link>

      <div className="hidden items-center gap-5 sm:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname === link.href ? 'page' : undefined}
            className={
              pathname === link.href ? 'gc-navlink active' : 'gc-navlink'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        {data ? (
          <>
            <NotificationBell />
            <UserMenu user={data.user} />
          </>
        ) : (
          <button
            type="button"
            onClick={getLoginRedirect}
            className="gc-glass-accent inline-flex h-9 items-center rounded-full px-5 text-sm font-bold text-white"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
