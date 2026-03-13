interface LoaderProps {
  size?: number
  center?: boolean
}

export const Loader = ({ size = 48, center = true }: LoaderProps) => {
  const spinner = (
    <div
      className="border-primary animate-spin rounded-full border-4 border-solid border-t-transparent"
      style={{ width: size, height: size }}
    />
  )

  if (!center) return spinner

  return (
    <div className="absolute flex h-full w-full items-center justify-center">
      {spinner}
    </div>
  )
}
