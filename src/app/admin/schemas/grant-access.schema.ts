import z from 'zod'

export const grantClientAccessParamsSchema = z.object({
  clientId: z.string().min(6),
  applicationSlug: z.string().min(2),
})

export const grantUserAccessParamsSchema = z.object({
  userPublicId: z.string().uuid(),
  applicationSlug: z.string().min(2),
})

export const grantUserAccessBodySchema = z.object({
  role: z.enum(['user', 'admin']).default('user').optional(),
})
