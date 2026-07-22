import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'

export const LoginButton = () => {
  return (
    <button
      onClick={getLoginRedirect}
      className="from-primary to-accent text-foreground transform rounded-lg bg-gradient-to-r px-4 py-1 font-bold shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
    >
      Sign in
    </button>
  )
}
