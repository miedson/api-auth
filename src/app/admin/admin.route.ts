import { BcryptPasswordHasher } from '@/app/auth/adapters/bcrypt-password-hasher.adapter'
import { errorSchema } from '@/app/common/schemas/error.schema'
import { prisma } from '@/lib/prisma'
import type { FastifyReply } from 'fastify'
import type { FastifyTypeInstance } from '@/types'
import { z } from 'zod'
import { createApplicationResponseSchema, createApplicationSchema } from './schemas/create-application.schema'
import { bindUserToApplicationParamsSchema } from './schemas/grant-access.schema'
import { CreateApplication } from './usecases/create-application.usecase'
import { GrantUserApplicationAccess } from './usecases/grant-user-application-access.usecase'
import { ApplicationRepository } from '../application/repositories/application.repository'
import { UserRepository } from '../users/repositories/user.repository'

type AdminErrorStatus = 401 | 403 | 404 | 409 | 422 | 500

const adminErrorResponses = {
  401: errorSchema,
  403: errorSchema,
  404: errorSchema,
  409: errorSchema,
  422: errorSchema,
  500: errorSchema,
} as const

const userRepository = new UserRepository(prisma)
const applicationRepository = new ApplicationRepository(prisma)
const hasher = new BcryptPasswordHasher()

const ensureRootUser = (
  reply: FastifyReply,
  role: string,
) => {
  if (role !== 'root') {
    reply.status(403).send({ message: 'Forbidden' })
    return false
  }

  return true
}

const mapAdminError = (error: unknown): { status: AdminErrorStatus; message: string } => {
  const message = error instanceof Error ? error.message : 'Internal server error'

  if (message.includes('Unauthorized')) return { status: 401, message }
  if (message.includes('Forbidden')) return { status: 403, message }
  if (message.includes('not found')) return { status: 404, message }
  if (message.includes('already exists')) return { status: 409, message }
  if (message.includes('Invalid')) return { status: 422, message }

  return { status: 500, message }
}

const sendAdminError = (reply: FastifyReply, error: unknown) => {
  const handled = mapAdminError(error)

  switch (handled.status) {
    case 401:
      return reply.status(401).send({ message: handled.message })
    case 403:
      return reply.status(403).send({ message: handled.message })
    case 404:
      return reply.status(404).send({ message: handled.message })
    case 409:
      return reply.status(409).send({ message: handled.message })
    case 422:
      return reply.status(422).send({ message: handled.message })
    default:
      return reply.status(500).send({ message: handled.message })
  }
}

export async function adminRoutes(app: FastifyTypeInstance) {
  app.post(
    '/applications',
    {
      schema: {
        tags: ['admin'],
        summary: 'Criar aplicacao',
        body: createApplicationSchema,
        response: {
          201: createApplicationResponseSchema,
          ...adminErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        if (
          !ensureRootUser(reply, request.user.role)
        ) {
          return
        }

        const createApplication = new CreateApplication(
          applicationRepository,
          hasher,
        )
        const created = await createApplication.execute(request.body)

        reply.code(201).send({
          publicId: created.application.publicId,
          name: created.application.name,
          slug: created.application.slug,
          secret: created.secret,
          status: created.application.status,
        })
      } catch (error) {
        return sendAdminError(reply, error)
      }
    },
  )

  app.post(
    '/applications/:applicationSlug/users/:userPublicId',
    {
      schema: {
        tags: ['admin'],
        summary: 'Associar usuario a aplicacao',
        params: bindUserToApplicationParamsSchema,
        response: {
          204: z.undefined(),
          ...adminErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        if (
          !ensureRootUser(reply, request.user.role)
        ) {
          return
        }

        const grantUserAccess = new GrantUserApplicationAccess(
          applicationRepository,
          userRepository,
        )

        await grantUserAccess.execute({
          userPublicId: request.params.userPublicId,
          applicationSlug: request.params.applicationSlug,
          role: 'user',
        })

        reply.code(204).send()
      } catch (error) {
        return sendAdminError(reply, error)
      }
    },
  )

}
