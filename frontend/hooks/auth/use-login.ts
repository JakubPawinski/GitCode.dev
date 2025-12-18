export const useLogin = () => {
  const login = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/auth/login?provider=keycloak`
  }

  return { login }
}