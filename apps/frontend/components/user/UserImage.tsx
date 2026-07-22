import { User } from 'lucide-react'
import Image from 'next/image'

interface UserImageProps {
  className?: string
  src?: string
  width: number
  height: number
}

export const UserImage = ({
  className,
  src,
  width,
  height,
}: UserImageProps) => {
  if (!src) {
    return <User className={className} width={width} height={height} />
  }
  return (
    <Image
      alt="user-image"
      loader={() => src}
      className={className}
      src={src}
      height={height}
      width={width}
    />
  )
}
