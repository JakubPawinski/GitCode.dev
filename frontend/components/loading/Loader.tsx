import { ClipLoader } from 'react-spinners'

export const Loader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-solid border-t-transparent"></div>
    </div>
  )
}
