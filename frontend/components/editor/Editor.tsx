import { Editor as MonacoEditor } from '@monaco-editor/react'
import { availableLanguages } from '@/consts/editor/languages'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { editorSchema, EditorType } from '@/config/editor-config'

interface EditorProps {
  postMutation: (payload: { payload: string }) => void
}
export const Editor = ({ postMutation }: EditorProps) => {
  const { control, handleSubmit, watch } = useForm<EditorType>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      languages: availableLanguages,
      blueprint: '// comment',
      code: '',
    },
  })

  const selectedLanguage = watch('languages')

  const onSubmit = (payload: EditorType) => {
    postMutation({ payload: payload.code })
  }
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow">
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
          <Controller
            control={control}
            name="languages"
            render={({ field: { onChange, value } }) => (
              <select
                onChange={onChange}
                defaultValue={value[0]}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-black"
              >
                {availableLanguages.map((lang: string) => (
                  <option value={lang} key={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="flex-grow">
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange } }) => (
              <MonacoEditor
                height="100%"
                defaultValue={control._defaultValues.blueprint}
                onChange={onChange}
                language={selectedLanguage[0]}
                theme="vs-dark"
              />
            )}
          />
        </div>

        <div className="flex justify-end bg-gray-100 px-4 py-2">
          <button
            type="submit"
            className="bg-primary hover:bg-foreground rounded px-4 py-2 text-sm font-semibold text-white"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}
