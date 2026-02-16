import { FastifyReply, FastifyRequest } from 'fastify'

export const errorHandler = (
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  request.log.error(
    {
      err: error,
      requestId: request.id,
      method: request.method,
      url: request.url,
      userId: request.user?.sub,
    },
    'Unhandled exception',
  )

  reply.send(error)
}
