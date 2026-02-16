import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const authRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export type AuthRequestBodyDto = z.infer<typeof authRequestSchema>
export type AuthRequestDto = AuthRequestBodyDto & {
  applicationSlug: z.infer<typeof applicationSlugSchema>
}
