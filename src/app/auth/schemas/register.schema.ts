import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'
import { registerUserSchema } from '@/app/users/schemas/user.schema'

export const registerSchema = registerUserSchema.extend({
  applicationSlug: applicationSlugSchema,
  role: z.enum(['user', 'admin']).optional(),
})

export type RegisterDto = z.infer<typeof registerSchema>
