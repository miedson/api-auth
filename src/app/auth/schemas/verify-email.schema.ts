import z from 'zod'

export const verifyEmailSchema = z.object({
  email: z.email(),
  code: z.string().length(6),
})

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>
