import z from 'zod'

export const editorSchema = z.object({
  language: z.string(),
  blueprint: z.string(),
  code: z.string().min(1),
})

export type EditorType = z.infer<typeof editorSchema>
