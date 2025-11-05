'use client'
import { Editor } from '@/components/editor/Editor'
import { usePostSubmission } from '@/hooks/use-post-submission'
export default function Home() {
  const { postMutation, data, loading, error } = usePostSubmission()

  return (
    <main className="bg-background h-screen w-screen p-4">
      <Editor postMutation={postMutation} />
    </main>
  )
}
