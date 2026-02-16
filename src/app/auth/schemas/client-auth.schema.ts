import z from 'zod'

export const clientAuthHeadersSchema = z.object({
  'x-client-id': z.string().min(6),
  'x-client-secret': z.string().min(10),
})

export type ClientAuthHeadersDto = z.infer<typeof clientAuthHeadersSchema>
