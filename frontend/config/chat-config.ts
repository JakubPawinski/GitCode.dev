import z from 'zod'

export const ChatSchema = z.object({
  message: z.string().min(1),
})
export type ChatSchemaType = z.infer<typeof ChatSchema>
