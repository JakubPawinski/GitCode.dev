import Link from 'next/link'
interface LoginLinkProps {
  loginUrl: string
}
export const LoginLink = ({ loginUrl }: LoginLinkProps) => {
  return <Link href={loginUrl}>Sign In</Link>
}
