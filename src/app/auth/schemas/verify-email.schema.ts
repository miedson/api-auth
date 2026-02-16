import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const verifyEmailSchema = z.object({
  email: z.email(),
  applicationSlug: applicationSlugSchema,
  code: z.string().length(6),
})

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>
