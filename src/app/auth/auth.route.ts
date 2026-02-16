import { BcryptPasswordHasher } from '@/app/auth/adapters/bcrypt-password-hasher.adapter'
import { Sha256TokenHasherAdapater } from '@/app/auth/adapters/sha256-token-hasher.adapter'
import { EmailVerificationCodeRepository } from '@/app/auth/repositories/email-verification-code.repository'
import { PasswordResetTokenRepository } from '@/app/auth/repositorories/password-reset-token.repository'
import { RefreshTokenRepository } from '@/app/auth/repositories/refresh-token.repository'
import { authRequestSchema } from '@/app/auth/schemas/auth-request.schema'
import { authResponseSchema } from '@/app/auth/schemas/auth-response.schema'
import {
  clientApplicationHeadersSchema,
  clientAuthHeadersSchema,
} from '@/app/auth/schemas/client-auth.schema'
import { forgotPasswordSchema } from '@/app/auth/schemas/forgot-password.schema'
import { logoutSchema } from '@/app/auth/schemas/logout.schema'
import { meResponseSchema } from '@/app/auth/schemas/me-response.schema'
import { refreshTokenSchema } from '@/app/auth/schemas/refresh-token.schema'
import { registerSchema } from '@/app/auth/schemas/register.schema'
import { registerResponseSchema } from '@/app/auth/schemas/register-response.schema'
import { resetPasswordSchema } from '@/app/auth/schemas/reset-password.schema'
import { verifyEmailSchema } from '@/app/auth/schemas/verify-email.schema'
import { EnsureClientApplicationAccess } from '@/app/auth/usecases/ensure-client-application-access.usecase'
import { ForgotUserPassword } from '@/app/auth/usecases/forgot-user-password.usecase'
import { GetMe } from '@/app/auth/usecases/get-me.usecase'
import { LoginUser } from '@/app/auth/usecases/login-user.usecase'
import { LogoutUser } from '@/app/auth/usecases/logout-user.usecase'
import { RefreshSession } from '@/app/auth/usecases/refresh-session.usecase'
import { RegisterUser } from '@/app/auth/usecases/register-user.usecase'
import { ResetPassword } from '@/app/auth/usecases/reset-password.usecase'
import { VerifyEmail } from '@/app/auth/usecases/verify-email.usecase'
import { createMailSenderFromEnv } from '@/app/common/factories/mail-sender.factory'
import { errorSchema } from '@/app/common/schemas/error.schema'
import { AuthClientRepository } from '@/app/client/repositories/auth-client.repository'
import { ApplicationRepository } from '@/app/application/repositories/application.repository'
import { UserRepository } from '@/app/users/repositories/user.repository'
import { prisma } from '@/lib/prisma'
import type { FastifyTypeInstance } from '@/types'
import type { FastifyReply } from 'fastify'
import { z } from 'zod'

const userRepository = new UserRepository(prisma)
const applicationRepository = new ApplicationRepository(prisma)
const authClientRepository = new AuthClientRepository(prisma)
const passwordResetTokenRepository = new PasswordResetTokenRepository(prisma)
const refreshTokenRepository = new RefreshTokenRepository(prisma)
const hasher = new BcryptPasswordHasher()
const tokenHasher = new Sha256TokenHasherAdapater()
const mailSender = createMailSenderFromEnv()
const ensureClientApplicationAccess = new EnsureClientApplicationAccess(
  authClientRepository,
)

const isProd = process.env.NODE_ENV === 'production'
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>

const commonErrorResponses = {
  401: errorSchema,
  403: errorSchema,
  422: errorSchema,
  500: errorSchema,
} as const

const mapError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Internal server error'

  if (message.includes('Invalid client credentials')) {
    return { status: 401 as const, message }
  }

  if (message.includes('Unauthorized')) {
    return { status: 401 as const, message }
  }

  if (message.includes('no access')) {
    return { status: 403 as const, message }
  }

  if (message.includes('Application unavailable')) {
    return { status: 422 as const, message }
  }

  if (message.includes('Email not verified')) {
    return { status: 422 as const, message }
  }

  if (message.includes('already registered')) {
    return { status: 422 as const, message }
  }

  if (message.includes('Invalid') || message.includes('expired')) {
    return { status: 422 as const, message }
  }

  return { status: 500 as const, message }
}

const sendMappedError = (reply: FastifyReply, error: unknown) => {
  const handled = mapError(error)

  switch (handled.status) {
    case 401:
      return reply.status(401).send({ message: handled.message })
    case 403:
      return reply.status(403).send({ message: handled.message })
    case 422:
      return reply.status(422).send({ message: handled.message })
    default:
      return reply.status(500).send({ message: handled.message })
  }
}

const ensureClientAccessByApplicationSlug = async (
  headers: unknown,
) => {
  const parsedHeaders = clientApplicationHeadersSchema.parse(headers)
  const application = await applicationRepository.findBySlug(
    parsedHeaders['x-application-slug'],
  )

  if (!application || application.status !== 'active') {
    throw new Error('Application unavailable')
  }

  await ensureClientApplicationAccess.execute({
    clientId: parsedHeaders['x-client-id'],
    clientSecret: parsedHeaders['x-client-secret'],
    application,
  })

  return application.slug
}

const ensureClientCredentials = async (headers: unknown) => {
  const parsedHeaders = clientAuthHeadersSchema.parse(headers)

  await ensureClientApplicationAccess.execute({
    clientId: parsedHeaders['x-client-id'],
    clientSecret: parsedHeaders['x-client-secret'],
  })
}

export async function authRoutes(app: FastifyTypeInstance) {
  app.post(
    '/register',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Criar conta de usuario na API Auth',
        headers: clientAuthHeadersSchema,
        body: registerSchema,
        response: {
          201: registerResponseSchema,
          202: registerResponseSchema,
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        await ensureClientCredentials(request.headers)

        const result = await prisma.$transaction(
          async (transaction: TransactionClient) => {
            const registerUser = new RegisterUser(
              new UserRepository(transaction),
              hasher,
              tokenHasher,
              mailSender,
              new EmailVerificationCodeRepository(transaction),
            )

            return registerUser.execute(request.body)
          },
        )

        if (result.status === 'verification_required') {
          reply.code(202).send(result)
          return
        }

        reply.code(201).send(result)
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.post(
    '/verify-email',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Validar e-mail com codigo',
        headers: clientAuthHeadersSchema,
        body: verifyEmailSchema,
        response: {
          204: z.undefined(),
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        await ensureClientCredentials(request.headers)

        await prisma.$transaction(async (transaction: TransactionClient) => {
          const verifyEmail = new VerifyEmail(
            new UserRepository(transaction),
            new EmailVerificationCodeRepository(transaction),
            tokenHasher,
          )

          await verifyEmail.execute(request.body)
        })

        reply.code(204).send()
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.post(
    '/login',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Autenticar usuario',
        headers: clientApplicationHeadersSchema,
        body: authRequestSchema,
        response: {
          201: authResponseSchema,
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const applicationSlug = await ensureClientAccessByApplicationSlug(
          request.headers,
        )

        const loginUser = new LoginUser(
          userRepository,
          applicationRepository,
          hasher,
          tokenHasher,
          refreshTokenRepository,
          request.jwt,
        )

        const result = await loginUser.execute({
          ...request.body,
          applicationSlug,
        })

        reply
          .setCookie('access_token', result.access_token, {
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
          })
          .setCookie('refresh_token', result.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
          })
          .code(201)
          .send(result)
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.post(
    '/refresh-token',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Renovar sessao',
        headers: clientApplicationHeadersSchema,
        body: refreshTokenSchema,
        response: {
          201: authResponseSchema,
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const applicationSlug = await ensureClientAccessByApplicationSlug(
          request.headers,
        )

        const refreshSession = new RefreshSession(
          userRepository,
          applicationRepository,
          refreshTokenRepository,
          tokenHasher,
          request.jwt,
        )

        const result = await refreshSession.execute({
          ...request.body,
          applicationSlug,
        })

        reply
          .setCookie('access_token', result.access_token, {
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
          })
          .setCookie('refresh_token', result.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
          })
          .code(201)
          .send(result)
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.post(
    '/forgot-password',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Solicitar recuperacao de senha',
        headers: clientApplicationHeadersSchema,
        body: forgotPasswordSchema,
        response: {
          204: z.undefined(),
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const applicationSlug = await ensureClientAccessByApplicationSlug(
          request.headers,
        )

        const forgotUserPassword = new ForgotUserPassword(
          userRepository,
          applicationRepository,
          mailSender,
          tokenHasher,
          passwordResetTokenRepository,
        )

        await forgotUserPassword.execute({ ...request.body, applicationSlug })
        reply.code(204).send()
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.post(
    '/reset-password',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Redefinir senha',
        headers: clientApplicationHeadersSchema,
        body: resetPasswordSchema,
        response: {
          201: z.undefined(),
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const applicationSlug = await ensureClientAccessByApplicationSlug(
          request.headers,
        )

        await prisma.$transaction(async (transaction: TransactionClient) => {
          const resetPassword = new ResetPassword(
            tokenHasher,
            new ApplicationRepository(transaction),
            new PasswordResetTokenRepository(transaction),
            new UserRepository(transaction),
            hasher,
          )

          await resetPassword.execute({ ...request.body, applicationSlug })
        })

        reply.code(201).send()
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.post(
    '/logout',
    {
      config: { public: true },
      schema: {
        tags: ['auth'],
        summary: 'Encerrar sessao',
        headers: clientApplicationHeadersSchema,
        body: logoutSchema,
        response: {
          204: z.undefined(),
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const applicationSlug = await ensureClientAccessByApplicationSlug(
          request.headers,
        )

        const logoutUser = new LogoutUser(
          applicationRepository,
          refreshTokenRepository,
          tokenHasher,
        )
        await logoutUser.execute({
          refreshToken: request.body.refresh_token,
          applicationSlug,
        })

        reply
          .clearCookie('access_token', { path: '/' })
          .clearCookie('refresh_token', { path: '/' })
          .code(204)
          .send()
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )

  app.get(
    '/me',
    {
      schema: {
        tags: ['auth'],
        summary: 'Retorna usuario autenticado na aplicacao atual',
        response: {
          200: meResponseSchema,
          ...commonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const getMe = new GetMe(userRepository, applicationRepository)
        const result = await getMe.execute({
          userPublicId: request.user.sub,
          applicationSlug: request.user.applicationSlug,
        })

        reply.code(200).send(result)
      } catch (error) {
        return sendMappedError(reply, error)
      }
    },
  )
}
