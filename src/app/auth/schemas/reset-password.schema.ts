import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'
import { passwordSchema } from '@/app/users/schemas/user.schema'

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
})

export type ResetPasswordBodyDto = z.infer<typeof resetPasswordSchema>
export type ResetPasswordDto = ResetPasswordBodyDto & {
  applicationSlug: z.infer<typeof applicationSlugSchema>
}
