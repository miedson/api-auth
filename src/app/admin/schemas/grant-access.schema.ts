import z from 'zod'

export const applicationMembershipRoleSchema = z.enum(['user', 'admin'])

export const bindUserToApplicationParamsSchema = z.object({
  applicationSlug: z.string().min(2),
  userPublicId: z.string().uuid(),
})

export const bindUserToApplicationBodySchema = z.object({
  role: applicationMembershipRoleSchema.optional(),
})

export const updateUserApplicationRoleBodySchema = z.object({
  role: applicationMembershipRoleSchema,
})
