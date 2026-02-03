import { Brain, SendHorizonal } from 'lucide-react'
import { usePostAiTutor } from '@/hooks/api/use.post-ai-tutor'
import { Controller, useForm } from 'react-hook-form'
import { ChatSchemaType } from '@/config/chat-config'
import { useAiSendMessageContext } from '@/contexts/ai/AiSendMessageContext'

export const AiTutorAside = () => {
  const { postMutation, data, loading, error } = usePostAiTutor()

  const { control, handleSubmit } = useForm<ChatSchemaType>({
    defaultValues: {
      message: '',
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  const partialMessageToSend = useAiSendMessageContext()

  //   const tutorHistory = useAiTutorContext()

  //   const updatedHistory = useMemo(
  //     () => [...tutorHistory?.tutorData, data],
  //     [data]
  //   )

  const onSubmit = (message: ChatSchemaType) => {
    const payload = {
      code: partialMessageToSend.messageData.code,
      problem_slug: partialMessageToSend.messageData.problemSlug,
      message: message.message,
    }
    postMutation(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <aside className="bg-background/80 border-primary/20 shadow-primary/10 flex h-full w-xl flex-col rounded-xl border shadow-2xl backdrop-blur-md lg:shrink-0">
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

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {JSON.stringify(data)}
        </main>

        <footer className="border-primary/10 border-t p-4">
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="message"
              render={({ field: { onChange, value } }) => (
                <input
                  type="text"
                  onChange={onChange}
                  value={value}
                  placeholder="Ask a question"
                  className="border-primary/20 bg-background/60 text-foreground placeholder:text-foreground/40 focus:border-primary/50 focus:ring-primary/20 flex-1 rounded-lg border px-3 py-2 text-sm transition outline-none focus:ring-2"
                />
              )}
            />

            <button
              type="submit"
              className="from-primary to-accent text-foreground flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r p-2 shadow-md transition-all duration-300 hover:shadow-lg"
            >
              <SendHorizonal size={20} />
            </button>
          </div>
        </footer>
      </aside>
    </form>
  )
}
