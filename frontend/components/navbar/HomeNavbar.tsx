'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { NotificationBell } from '../notification/NotificationBell'
import { UserMenu } from './UserMenu'

export const HomeNavbar = () => {
  const { problem } = useParams()

  if (problem) return null

  return (
    <nav className="border-primary/30 flex h-12 items-center justify-between border-b bg-transparent px-6 shadow-lg">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-primary hover:text-accent flex items-center transition-all duration-300"
        >
          <Image
            alt="logo"
            src={'/logo.png'}
            width={48}
            height={48}
            className="rounded-md"
          />
          <span className="text-xl font-bold">GitCode.dev</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </nav>
  )
}
