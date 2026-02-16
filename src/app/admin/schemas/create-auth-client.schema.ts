import z from 'zod'

export const createAuthClientSchema = z.object({
  name: z.string().min(2).max(120),
  clientId: z.string().min(6).max(120).optional(),
  clientSecret: z.string().min(20).max(200).optional(),
})

export const createAuthClientResponseSchema = z.object({
  publicId: z.string(),
  name: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  status: z.enum(['active', 'revoked']),
})

export type CreateAuthClientDto = z.infer<typeof createAuthClientSchema>
