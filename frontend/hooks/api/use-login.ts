// GitCode.dev/frontend/hooks/api/use-login.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export const useLogin = () => {
  const login = () => {
    window.location.href = `${API_BASE_URL}/api/auth/login?provider=keycloak`
  }

  return { login }
}