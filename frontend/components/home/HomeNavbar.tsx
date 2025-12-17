'use client'
import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import LogoutButton from '../logout/LogoutButton'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth/AuthContext'

export const HomeNavbar = () => {
  const { problem } = useParams()
  const { user } = useAuth()

  if (problem || !user) return null

  const { avatarUrl, username } = user

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
      <div className="flex items-center gap-6">
        <Link href={`/profile/${username}`}>
          {avatarUrl ? (
            <Image
              loader={() => avatarUrl}
              alt="avatar"
              src={avatarUrl}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <User size={36} />
          )}
        </Link>
        <LogoutButton />
      </div>
    </nav>
  )
}
