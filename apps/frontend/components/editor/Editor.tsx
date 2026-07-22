import { Editor as MonacoEditor } from '@monaco-editor/react'
import { availableLanguages } from '@/consts/editor/languages'
import { Controller } from 'react-hook-form'
import { EditorType } from '@/config/editor-config'
import { Code } from 'lucide-react'
import { Control } from 'react-hook-form'
import { Loader } from '../loading/Loader'

export interface ControllerProps {
  control: Control<EditorType>
  selectedLanguage: string
}
export const Editor = ({ control, selectedLanguage }: ControllerProps) => {
  return (
    <div className="border-primary/20 flex h-full w-full flex-col rounded-lg border bg-transparent p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-foreground flex items-center gap-2 text-lg font-semibold">
          <Code />
          <span>Code Editor</span>
        </div>
        <Controller
          control={control}
          name="language"
          render={({ field: { onChange, value } }) => (
            <select
              onChange={onChange}
              value={value}
              className="bg-primary/10 border-primary/30 text-foreground focus:ring-accent rounded-md border px-3 py-1.5 transition-all focus:ring-2 focus:outline-none"
            >
              {availableLanguages.map((lang: string) => (
                <option
                  value={lang}
                  key={lang}
                  className="bg-background text-foreground"
                >
                  {lang}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div className="border-primary/20 h-full w-full overflow-hidden rounded-lg border shadow-2xl">
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <MonacoEditor
              value={value}
              onChange={onChange}
              language={selectedLanguage}
              theme="vs-dark"
              loading={<Loader />}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: {
                  top: 8,
                },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
              }}
            />
          )}
        />
      </div>
    </div>
  )
}
