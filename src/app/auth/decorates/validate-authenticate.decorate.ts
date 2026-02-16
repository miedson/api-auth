import type { FastifyJWT } from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'

export const validateAuthenticateDecorate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const isPublic = request.routeOptions.config?.public
  if (isPublic) return

  const token = request.cookies.access_token

  if (!token) {
    reply.status(401).send({ message: 'Unauthorized' })
    return
  }

  try {
    const decoded = request.jwt.verify<FastifyJWT['user']>(token)
    request.user = decoded
  } catch {
    reply.status(401).send({ message: 'Unauthorized' })
  }
}
