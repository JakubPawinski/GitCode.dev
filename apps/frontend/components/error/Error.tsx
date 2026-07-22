import { X } from 'lucide-react'
interface ErrorProps {
  error: any
  onClose?: () => void
}
export const Error = ({ error, onClose }: ErrorProps) => {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="bg-background/80 text-foreground flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-red-500/30 p-6 text-center shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <X className="text-red-500" size={24} />
        </div>
        <h1 className="text-xl font-bold">Oops! Something went wrong.</h1>
        <p className="text-foreground/80">
          {error?.message || 'An unexpected error occurred.'}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="hover:bg-primary/20 mt-4 rounded-md px-4 py-2 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
