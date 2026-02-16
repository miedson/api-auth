import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const logoutSchema = z.object({
  refresh_token: z.string().min(20),
})

export type LogoutBodyDto = z.infer<typeof logoutSchema>
export type LogoutDto = LogoutBodyDto & {
  applicationSlug: z.infer<typeof applicationSlugSchema>
}
