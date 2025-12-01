import { LoginLink } from '../login/LoginLink'
export const HomeNavbar = () => {
  const loginUrl = process.env.LOGIN_URL || ''
  return (
    <nav>
      {/* <Image alt="logo" src={'logo??'} /> */}
      <LoginLink loginUrl={loginUrl} />
    </nav>
  )
}
