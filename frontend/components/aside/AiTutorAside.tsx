import { Brain, SendHorizonal } from 'lucide-react'
import { usePostAiTutor } from '@/hooks/ai/use-post-ai-tutor'
import { Controller, useForm } from 'react-hook-form'
import { ChatSchema, ChatSchemaType } from '@/config/chat-config'
import { useAiSendMessageContext } from '@/contexts/ai/AiSendMessageContext'
import { useAiTutorContext } from '@/contexts/ai/AiTutorContext'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'
import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'

interface Message {
  role: string
  content: string
}

export const AiTutorAside = () => {
  const { postMutation, data, loading, error } = usePostAiTutor()

  const { control, handleSubmit, reset } = useForm<ChatSchemaType>({
    resolver: zodResolver(ChatSchema),
    defaultValues: {
      message: '',
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  })
  const { tutorData, tutorLoading, tutorError } = useAiTutorContext()

  const [messages, setMessages] = useState<Message[]>(tutorData.messages)

  const messageRef = useRef<null | HTMLElement>(null)

  const partialMessageToSend = useAiSendMessageContext()

  useEffect(() => {
    queueMicrotask(() => {
      messageRef.current?.scrollTo({ top: messageRef.current.scrollHeight })
    })
    if (data) {
      const croppedData = (data as string).slice(6)
      const parsedMessage = JSON.parse(croppedData).text
      const tutorMessage = {
        role: 'assistant',
        content: parsedMessage,
      }
      setMessages((previous: Message[]) => [...previous, tutorMessage])
      queueMicrotask(() => {
        messageRef.current?.scrollTo({ top: messageRef.current.scrollHeight })
      })
    }
  }, [data])

  const onSubmit = (message: ChatSchemaType) => {
    const trimmed = message.message.trim()
    if (!trimmed) return

    const payload = {
      code: partialMessageToSend.messageData.code,
      problem_slug: partialMessageToSend.messageData.problemSlug,
      message: trimmed,
    }
    const newMessage: Message = {
      role: 'user',
      content: message.message,
    }
    setMessages((previous: Message[]) => [...previous, newMessage])
    queueMicrotask(() => {
      messageRef.current?.scrollTo({ top: messageRef.current.scrollHeight })
    })
    postMutation({ payload })
    reset({ message: '' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <aside className="bg-background/80 border-primary/20 shadow-primary/10 flex h-screen w-xl flex-col overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md lg:shrink-0">
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

        <main
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4"
          ref={messageRef}
        >
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-foreground/60 text-sm">
                No messages yet. Ask something about this problem or your code.
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-primary/20 text-foreground rounded-br-md'
                        : 'bg-muted/50 text-foreground/90 rounded-bl-md'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {tutorLoading && <Loader />}
            {tutorError && <Error {...error} />}

            {error && (
              <div className="text-destructive text-sm">
                Failed to get a response from the tutor.
              </div>
            )}
          </div>
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
              disabled={loading}
              className="from-primary to-accent text-foreground flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r p-2 shadow-md transition-all duration-300 hover:shadow-lg"
            >
              {loading ? (
                <div className="border-foreground/30 border-t-foreground h-5 w-5 animate-spin rounded-full border-2" />
              ) : (
                <SendHorizonal size={20} />
              )}
            </button>
          </div>
        </footer>
      </aside>
    </form>
  )
}
