import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(20),
  applicationSlug: applicationSlugSchema,
})

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>
