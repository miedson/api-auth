import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const createApplicationSchema = z.object({
  name: z.string().min(2).max(120),
  slug: applicationSlugSchema.optional(),
})

export const createApplicationResponseSchema = z.object({
  publicId: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(['active', 'suspended']),
})

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>
