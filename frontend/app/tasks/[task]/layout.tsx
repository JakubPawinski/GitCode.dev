'use client'
import { Editor } from '@/components/editor/Editor'
import { LeftNavbar } from '@/components/navbar/LeftNavbar'
import { PrimaryNavbar } from '@/components/navbar/PrimaryNavbar'
import { usePostSubmission } from '@/hooks/api/use-post-submission'
import { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { editorSchema, EditorType } from '@/config/editor-config'
import { zodResolver } from '@hookform/resolvers/zod'
import { availableLanguages } from '@/consts/editor/languages'
interface ResultProps {
  hasPassed: boolean
  submitId: string
}

export default function TaskLayout({ children }: PropsWithChildren) {
  const { control, handleSubmit, watch } = useForm<EditorType>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      language: availableLanguages[0],
      blueprint: '//',
      code: '',
    },
  })
  const selectedLanguage = watch('language')

  const { postMutation, data, loading, error } = usePostSubmission()

  const { hasPassed, submitId } = (data as ResultProps) || {}

  const onSubmit = (data: EditorType) => {
    postMutation({
      payload: {
        code: data.code,
        language: data.language,
      },
    })
  }
  return (
    <form>
      <nav>
        <PrimaryNavbar
          onSubmit={handleSubmit(onSubmit)}
          submissionLoading={loading}
          submissionError={error}
        />
      </nav>
      <section>
        <LeftNavbar hasPassed={hasPassed} submitId={submitId} />
        {children}
      </section>
      <aside>
        <Editor control={control} selectedLanguage={selectedLanguage} />
      </aside>
    </form>
  )
}
