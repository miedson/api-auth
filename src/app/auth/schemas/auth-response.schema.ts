import z from 'zod'
import { applicationSummarySchema } from '@/app/application/schemas/application.schema'
import { userSummarySchema } from '@/app/users/schemas/user.schema'

export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  user: userSummarySchema,
  application: applicationSummarySchema,
})

export type AuthResponseDto = z.infer<typeof authResponseSchema>
