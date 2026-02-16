import z from 'zod'
import { applicationSummarySchema } from '@/app/application/schemas/application.schema'
import { userSummarySchema } from '@/app/users/schemas/user.schema'

export const meResponseSchema = z.object({
  user: userSummarySchema,
  application: applicationSummarySchema,
})

export type MeResponseDto = z.infer<typeof meResponseSchema>
