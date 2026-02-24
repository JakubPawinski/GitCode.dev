import Link from 'next/link'
import { UserProps } from '../user/User'
import { UserImage } from '../user/UserImage'

export const ProfileLink = ({ username, avatarUrl }: UserProps) => {
  return (
    <div className="flex items-center gap-6">
      <Link href={`/profile/${username}`}>
        <UserImage
          className="rounded-full"
          src={avatarUrl}
          width={36}
          height={36}
        />
      </Link>
    </div>
  )
}
