import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { LogIn } from 'lucide-react'
import Image from 'next/image'
export const Login = () => {
  return (
    <main className="from-background via-primary/5 to-accent/5 flex h-screen w-full items-center justify-center bg-gradient-to-br p-4">
      <div className="border-primary/20 bg-background/30 shadow-primary/10 flex w-full max-w-md flex-col items-center rounded-2xl border p-8 text-center shadow-2xl backdrop-blur-lg">
        <Image
          alt="logo"
          src={'/logo.png'}
          width={80}
          height={80}
          className="rounded-xl shadow-lg"
        />
        <h1 className="text-foreground mt-6 text-4xl font-bold">
          Welcome to GitCode.dev
        </h1>
        <p className="text-foreground/70 mt-2">
          Sign in to continue and start your coding journey.
        </p>
        <button
          onClick={getLoginRedirect}
          className="from-primary to-accent text-foreground hover:shadow-primary/30 mt-8 flex w-full transform cursor-pointer items-center justify-center gap-3 rounded-lg bg-gradient-to-r px-6 py-3 font-bold shadow-lg transition-all duration-300 hover:scale-105"
          data-testid="login-button"
        >
          <LogIn size={20} />
          <span>Sign In</span>
        </button>
      </div>
    </main>
  )
}
