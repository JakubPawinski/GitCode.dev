import { baseURL } from '@/api/axios'
export const getLoginRedirect = () => {
  window.location.assign(`${baseURL}/auth/login`)
}
