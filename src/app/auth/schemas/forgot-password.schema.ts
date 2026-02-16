import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'E-mail obrigatorio' }),
})

export type ForgotPasswordBodyDto = z.infer<typeof forgotPasswordSchema>
export type ForgotPasswordDto = ForgotPasswordBodyDto & {
  applicationSlug: z.infer<typeof applicationSlugSchema>
}
