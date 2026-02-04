import { Brain, SendHorizonal } from 'lucide-react'
import { usePostAiTutor } from '@/hooks/api/use-post-ai-tutor'
import { Controller, useForm } from 'react-hook-form'
import { ChatSchema, ChatSchemaType } from '@/config/chat-config'
import { useAiSendMessageContext } from '@/contexts/ai/AiSendMessageContext'
import { useAiTutorContext } from '@/contexts/ai/AiTutorContext'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'
import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'

type UiChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  status?: 'streaming'
}

const normalizeRole = (role: unknown): 'user' | 'assistant' =>
  role === 'user' ? 'user' : 'assistant'

const normalizeContent = (msg: any): string =>
  (typeof msg?.content === 'string' && msg.content) ||
  (typeof msg?.message === 'string' && msg.message) ||
  ''

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
  const { tutorData, messageLoading, messageError } = useAiTutorContext()

  const initialMessages = useMemo<UiChatMessage[]>(() => {
    const base = Array.isArray((tutorData as any)?.messages)
      ? ((tutorData as any).messages as any[])
      : []
    return base
      .map((m, idx) => ({
        id: `history-${idx}-${m?.createdAt ?? ''}`,
        role: normalizeRole(m?.role),
        content: normalizeContent(m),
        createdAt: typeof m?.createdAt === 'string' ? m.createdAt : undefined,
      }))
      .filter((m) => m.content.length > 0)
  }, [tutorData])

  const [messages, setMessages] = useState<UiChatMessage[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)
  const streamingAssistantIdRef = useRef<string | null>(null)
  const didInitRef = useRef(false)

  useEffect(() => {
    setMessages(initialMessages)
    streamingAssistantIdRef.current = null
    didInitRef.current = true
    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: 0 })
    })
  }, [initialMessages])

  useEffect(() => {
    const id = streamingAssistantIdRef.current
    if (!id) return

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: data } : m))
    )

    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [data])

  useEffect(() => {
    if (!didInitRef.current) return
    if (!loading && streamingAssistantIdRef.current) {
      const id = streamingAssistantIdRef.current
      streamingAssistantIdRef.current = null
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: undefined } : m))
      )
    }
  }, [loading])

  if (messageLoading) {
    return <Loader />
  }
  if (messageError) {
    return <Error {...messageError} />
  }

  const partialMessageToSend = useAiSendMessageContext()

  const onSubmit = (message: ChatSchemaType) => {
    const trimmed = message.message.trim()
    if (!trimmed) return

    const userMsg: UiChatMessage = {
      id: `local-user-${crypto.randomUUID()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    const assistantId = `local-assistant-${crypto.randomUUID()}`
    const assistantMsg: UiChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'streaming',
    }

    streamingAssistantIdRef.current = assistantId
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    reset({ message: '' })
    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    })

    const payload = {
      code: partialMessageToSend.messageData.code,
      problem_slug: partialMessageToSend.messageData.problemSlug,
      message: trimmed,
    }
    postMutation({ payload })
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
          ref={listRef}
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4"
        >
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-foreground/60 text-sm">
                No messages yet. Ask something about this problem or your code.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground rounded-br-md'
                        : 'bg-muted/50 text-foreground/90 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                    {msg.status === 'streaming' && (
                      <span className="text-foreground/50">▍</span>
                    )}
                  </div>
                </div>
              ))
            )}

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
