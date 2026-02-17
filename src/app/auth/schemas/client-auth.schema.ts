import z from 'zod'
import { applicationSlugSchema } from '@/app/application/schemas/application.schema'

export const clientAuthHeadersSchema = z.object({
  'x-client-id': z.string().min(6),
  'x-client-secret': z.string().min(10),
})

export const clientApplicationHeadersSchema = clientAuthHeadersSchema.extend({
  'x-application-slug': applicationSlugSchema,
})

export const optionalClientApplicationHeadersSchema = z.object({
  'x-client-id': z.string().min(6).optional(),
  'x-client-secret': z.string().min(10).optional(),
  'x-application-slug': applicationSlugSchema.optional(),
})

export type ClientAuthHeadersDto = z.infer<typeof clientAuthHeadersSchema>
export type ClientApplicationHeadersDto = z.infer<
  typeof clientApplicationHeadersSchema
>
export type OptionalClientApplicationHeadersDto = z.infer<
  typeof optionalClientApplicationHeadersSchema
>
