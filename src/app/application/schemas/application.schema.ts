import z from 'zod'

export const applicationSlugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, {
    message: 'applicationSlug deve conter apenas letras minusculas, numeros e hifen',
  })

export const applicationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: applicationSlugSchema,
  role: z.enum(['user', 'admin']),
})

export type ApplicationSummaryDto = z.infer<typeof applicationSummarySchema>
