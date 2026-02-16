import z from 'zod'

export const passwordSchema = z
  .string()
  .min(8, { error: 'Senha deve ter no minimo 8 caracteres' })
  .max(128, { error: 'Senha deve ter no maximo 128 caracteres' })
  .regex(/[a-z]/, { error: 'Precisa de letra minuscula' })
  .regex(/[A-Z]/, { error: 'Precisa de letra maiuscula' })
  .regex(/[0-9]/, { error: 'Precisa de numero' })
  .regex(/[^A-Za-z0-9]/, { error: 'Precisa de simbolo' })

export const registerUserSchema = z.object({
  name: z.string().min(1).max(120),
  displayName: z.string().min(1).max(50).optional().nullable(),
  email: z.email().max(254),
  password: passwordSchema,
})

export type RegisterUserDto = z.infer<typeof registerUserSchema>

export const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  email: z.email(),
})

export type UserSummaryDto = z.infer<typeof userSummarySchema>
