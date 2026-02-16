import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const authRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  applicationSlug: applicationSlugSchema,
})

export type AuthRequestDto = z.infer<typeof authRequestSchema>
