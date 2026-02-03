import { useGetAiTutorHistory } from '@/hooks/api/use-get-ai-tutor-history'
import { Brain, SendHorizonal } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'

export const AiTutorAside = () => {
  const params = useParams()
  const problem = params.problem!.toString()

  const { data, loading, error } = useGetAiTutorHistory({ problem })

  if (!data) return null
  if (loading) return <Loader />
  if (error) return <Error {...error} />

  console.log(data)

  return (
    <aside className="bg-background/80 border-primary/20 shadow-primary/10 flex h-full w-full w-xl flex-col rounded-xl border shadow-2xl backdrop-blur-md lg:shrink-0">
      <header className="border-primary/10 flex items-center gap-3 border-b p-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Brain size={22} />
        </div>
        <div className="flex flex-col leading-tight">
          <div className="text-foreground text-base font-semibold tracking-wide">
            Ask GitCode
          </div>
          <div className="text-foreground/60 text-xs tracking-wide">
            AI Tutor
          </div>
        </div>
      </header>

      <main className="custom-scrollbar flex-1 overflow-y-auto p-4"></main>

      <footer className="border-primary/10 border-t p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask a question"
            className="border-primary/20 bg-background/60 text-foreground placeholder:text-foreground/40 focus:border-primary/50 focus:ring-primary/20 flex-1 rounded-lg border px-3 py-2 text-sm transition outline-none focus:ring-2"
          />
          <button
            type="button"
            className="from-primary to-accent text-foreground flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r p-2 shadow-md transition-all duration-300 hover:shadow-lg"
            aria-label="Send"
          >
            <SendHorizonal size={20} />
          </button>
        </div>
      </footer>
    </aside>
  )
}
