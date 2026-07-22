import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { Github } from 'lucide-react'
import { Logo } from '@/components/branding/Logo'

export const Login = () => {
  return (
    <main className="bg-gc-bg relative flex h-[calc(100vh-3.5rem)] w-full items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[60px]"
        style={{
          background:
            'radial-gradient(circle, var(--accent-soft), transparent 70%)',
        }}
      />

      <div className="border-gc-border bg-gc-surface relative flex w-full max-w-sm flex-col items-center rounded-2xl border p-9 text-center shadow-2xl">
        <Logo size={48} withWordmark={false} />
        <h1 className="text-gc-text mt-6 text-2xl font-bold">
          Welcome to GitCode.dev
        </h1>
        <p className="text-gc-text-muted mt-2 text-[14px]">
          Sign in to continue and start your coding journey.
        </p>
        <button
          onClick={getLoginRedirect}
          className="gc-glass-accent mt-8 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg text-[14.5px] font-bold text-white"
        >
          <Github size={18} />
          <span>Sign in with GitHub</span>
        </button>
      </div>
    </main>
  )
}
