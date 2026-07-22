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
    // `className` (rounding/sizing/color) is applied to this wrapper, not the
    // icon itself — an SVG has no fill box for `rounded-full` etc. to act on,
    // which is what made the fallback avatar look angular instead of circular.
    return (
      <span
        className={`inline-flex items-center justify-center bg-white/10 ${className ?? ''}`}
      >
        <User className="h-[58%] w-[58%]" />
      </span>
    )
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
