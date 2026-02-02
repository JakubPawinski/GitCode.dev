'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth/AuthContext'
import { ProfileLink } from './ProfileLink'

export const HomeNavbar = () => {
  const { problem } = useParams()
  const { data } = useAuth()

  if (problem || !data) return null

  const { user } = data

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
      <ProfileLink {...user} />
    </nav>
  )
}
