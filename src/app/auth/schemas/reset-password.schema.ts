import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'
import { passwordSchema } from '@/app/users/schemas/user.schema'

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
  applicationSlug: applicationSlugSchema,
})

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
