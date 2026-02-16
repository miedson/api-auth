import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'E-mail obrigatorio' }),
  applicationSlug: applicationSlugSchema,
})

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>
