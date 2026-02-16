import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const logoutSchema = z.object({
  refresh_token: z.string().min(20),
  applicationSlug: applicationSlugSchema,
})

export type LogoutDto = z.infer<typeof logoutSchema>
