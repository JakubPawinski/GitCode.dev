import { X } from 'lucide-react'
interface ErrorProps {
  error: any
  onClose: () => void
}
export const Error = ({ error, onClose }: ErrorProps) => {
  return (
    <div>
      <div>
        <h1>Oops!</h1>
        <div>Something went wrong.</div>
        {error?.status && <p>Error code: {error.status}</p>}
      </div>
      <div onClick={onClose}>
        <X />
      </div>
    </div>
  )
}
