import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(20),
})

export type RefreshTokenBodyDto = z.infer<typeof refreshTokenSchema>
export type RefreshTokenDto = RefreshTokenBodyDto & {
  applicationSlug: z.infer<typeof applicationSlugSchema>
}
