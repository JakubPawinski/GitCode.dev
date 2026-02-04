'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'
import { UserProps } from '@/components/user/User'
import { UserImage } from '@/components/user/UserImage'
import { usePostLogout } from '@/hooks/auth/use-post-logout'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'
import { api } from '@/api/axios'
import { useAuth } from '@/contexts/auth/AuthContext'
type UserMenuProps = {
  user: UserProps
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { setData } = useAuth()

  const profileHref = useMemo(
    () => `/profile/${user.username}`,
    [user.username]
  )

  const { postMutation, data, loading, error } = usePostLogout()

  useEffect(() => {
    if (!open) return

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (!rootRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (loading) {
    return <Loader />
  }
  if (error) {
    return <Error {...error} />
  }

  const logout = async () => {
    postMutation().then(() => {
      setData(null)
      delete api.defaults.headers.common.Authorization
      setOpen(false)
      router.replace('/login')
      router.refresh()
    })
  }

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border-primary/20 hover:border-primary/40 focus:ring-primary/20 bg-background/40 flex items-center gap-2 rounded-full border p-0.5 transition outline-none focus:ring-2"
      >
        <UserImage
          src={user.avatarUrl}
          width={32}
          height={32}
          className="rounded-full"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="border-primary/20 bg-background/90 absolute top-12 right-0 z-50 w-56 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md"
        >
          <div className="border-primary/10 border-b px-4 py-3">
            <div className="text-foreground text-sm leading-tight font-semibold">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-foreground/60 text-xs">@{user.username}</div>
          </div>

          <div className="p-2">
            <Link
              role="menuitem"
              href={profileHref}
              onClick={() => setOpen(false)}
              className="hover:bg-primary/10 text-foreground flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition"
            >
              <UserRound size={18} className="text-foreground/70" />
              <span>Go to profile</span>
            </Link>

            <button
              role="menuitem"
              type="button"
              onClick={logout}
              className="hover:bg-destructive/10 text-foreground flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition"
            >
              <LogOut size={18} className="text-foreground/70" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
