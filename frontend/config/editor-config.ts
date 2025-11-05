import z from 'zod'

export const editorSchema = z.object({
  languages: z.array(z.string()),
  blueprint: z.string(),
  code: z.string(),
})

export type EditorType = z.infer<typeof editorSchema>
