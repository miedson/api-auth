import z from 'zod'
import { registerUserSchema } from '@/app/users/schemas/user.schema'

export const registerSchema = registerUserSchema.extend({
  role: z.enum(['application', 'root']),
})

export type RegisterDto = z.infer<typeof registerSchema>
