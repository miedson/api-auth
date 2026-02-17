import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const applicationAuthHeadersSchema = z.object({
  'x-application-slug': applicationSlugSchema,
  'x-application-secret': z.string().min(20),
})

export const optionalApplicationAuthHeadersSchema = z.object({
  'x-application-slug': applicationSlugSchema.optional(),
  'x-application-secret': z.string().min(20).optional(),
})

export type ApplicationAuthHeadersDto = z.infer<
  typeof applicationAuthHeadersSchema
>
export type OptionalApplicationAuthHeadersDto = z.infer<
  typeof optionalApplicationAuthHeadersSchema
>
