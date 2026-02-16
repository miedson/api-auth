import z from 'zod'

export const grantClientAccessParamsSchema = z.object({
  clientId: z.string().min(6),
  applicationSlug: z.string().min(2),
})

export const bindUserToApplicationParamsSchema = z.object({
  applicationSlug: z.string().min(2),
  userPublicId: z.string().uuid(),
})
