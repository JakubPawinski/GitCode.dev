'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { UserProps } from '@/components/user/User'
import { UserImage } from '@/components/user/UserImage'
import { usePostLogout } from '@/hooks/auth/use-post-logout'
import { api } from '@/api/axios'
import { useAuth } from '@/contexts/auth/AuthContext'
import { Logo } from '@/components/branding/Logo'

type UserMenuProps = {
  user: UserProps
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { setData, setIsLoggingOut } = useAuth()
  const { postMutation, loading: loggingOut } = usePostLogout()

  const profileHref = useMemo(
    () => `/profile/${user.username}`,
    [user.username]
  )
  const editProfileHref = useMemo(
    () => `/profile/${user.username}/edit`,
    [user.username]
  )

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

  const handleLogout = () => {
    const clearSession = () => {
      // Tell Interceptor this is a deliberate logout before clearing `data`,
      // so it doesn't treat the resulting `data === null` as an expired
      // session and try to silently refresh (or redirect back into login).
      setIsLoggingOut(true)
      setData(null)
      delete api.defaults.headers.common.Authorization
      setOpen(false)
      router.replace('/')
      router.refresh()
    }
    // The local session is cleared either way — a failed logout call on the
    // backend shouldn't leave the user stuck behind a stale "signed in" UI.
    postMutation().then(clearSession).catch(clearSession)
  }

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border-gc-border hover:border-gc-accent focus-visible:outline-gc-focus flex items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 transition-colors outline-none"
      >
        <span className="bg-gc-surface-2 block h-8 w-8 overflow-hidden rounded-full">
          <UserImage
            src={user.avatarUrl}
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </span>
        <ChevronDown
          size={14}
          className={`text-gc-text-dim transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="gc-dropdown-enter border-gc-border bg-gc-surface absolute top-16 right-0 z-50 w-64 overflow-hidden rounded-2xl border shadow-2xl"
        >
          <div className="border-gc-border flex items-center gap-3 border-b px-4 py-3.5">
            <span className="bg-gc-surface-2 block h-11 w-11 flex-none overflow-hidden rounded-full">
              <UserImage
                src={user.avatarUrl}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0">
              <div className="text-gc-text truncate text-sm font-bold">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-gc-text-dim font-gc-mono truncate text-xs">
                @{user.username}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            <Link
              role="menuitem"
              href={profileHref}
              onClick={() => setOpen(false)}
              className="text-gc-text-muted hover:bg-gc-surface-2 hover:text-gc-text flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <UserRound size={17} />
              <span>View profile</span>
            </Link>
            <Link
              role="menuitem"
              href={editProfileHref}
              onClick={() => setOpen(false)}
              className="text-gc-text-muted hover:bg-gc-surface-2 hover:text-gc-text flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <Settings size={17} />
              <span>Edit profile</span>
            </Link>
          </div>

          <div className="border-gc-border border-t p-2">
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <LogOut size={17} />
              <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>

          <div className="border-gc-border flex items-center gap-2 border-t px-4 py-3">
            <Logo size={16} withWordmark={false} />
            <span className="font-gc-mono text-gc-text-dim text-[11px] tracking-wide">
              git<span className="text-gc-accent">code</span>.dev
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
