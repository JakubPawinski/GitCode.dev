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
    <div>
      <div>
        <div>
          <Controller
            control={control}
            name="language"
            render={({ field: { onChange, value } }) => (
              <div>
                <nav>
                  <Code />
                  <div>Code</div>
                </nav>
                <select onChange={onChange} defaultValue={value[0]}>
                  {availableLanguages.map((lang: string) => (
                    <option value={lang} key={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange } }) => (
              <MonacoEditor
                onChange={onChange}
                language={selectedLanguage}
                theme="vs-dark"
                loading={<Loader />}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}
