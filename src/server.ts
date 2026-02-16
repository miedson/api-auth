import fCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fjtw from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import 'dotenv/config'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { adminRoutes } from '@/app/admin/admin.route'
import { authRoutes } from '@/app/auth/auth.route'
import { validateAuthenticateDecorate } from '@/app/auth/decorates/validate-authenticate.decorate'
import { errorHandler } from '@/app/common/error-handler'

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'SYS:standard',
              colorize: true,
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
}).withTypeProvider<ZodTypeProvider>()

const isProduction = process.env.NODE_ENV === 'production'
const enableDocs = !isProduction || process.env.ENABLE_DOCS === 'true'
const docsBasicUser = process.env.DOCS_BASIC_USER
const docsBasicPassword = process.env.DOCS_BASIC_PASSWORD

if (isProduction && enableDocs && (!docsBasicUser || !docsBasicPassword)) {
  throw new Error(
    'DOCS_BASIC_USER and DOCS_BASIC_PASSWORD are required when ENABLE_DOCS=true in production',
  )
}

const hasValidDocsBasicAuth = (authorization?: string): boolean => {
  if (!authorization?.startsWith('Basic ')) return false

  const encoded = authorization.slice('Basic '.length).trim()

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')
    if (separatorIndex < 0) return false

    const user = decoded.slice(0, separatorIndex)
    const password = decoded.slice(separatorIndex + 1)

    return user === docsBasicUser && password === docsBasicPassword
  } catch {
    return false
  }
}

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
})

app.register(fjtw, {
  secret: process.env.JWT_SECRET || 'default-jwt-secret',
})

app.addHook('preHandler', (req, _, next) => {
  req.jwt = app.jwt
  return next()
})

app.register(fCookie, {
  secret: process.env.COOKIE_SECRET || 'default-cookie-secret',
  hook: 'preHandler',
})

app.addHook('preHandler', validateAuthenticateDecorate)

if (enableDocs) {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'API Auth',
        description: 'Authentication API documentation',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(ScalarApiReference, {
    routePrefix: '/docs',
    hooks: {
      onRequest: (request, reply, done) => {
        if (!isProduction) {
          request.routeOptions.config.public = true
          done()
          return
        }

        if (!hasValidDocsBasicAuth(request.headers.authorization)) {
          reply
            .code(401)
            .header('WWW-Authenticate', 'Basic realm="api-auth-docs"')
            .send({ message: 'Unauthorized' })
          return
        }
        done()
      },
    },
  })
}

app.register(authRoutes, { prefix: 'api/v1' })
app.register(adminRoutes, { prefix: 'api/v1/admin' })

app.setErrorHandler(errorHandler)

app
  .listen({
    port: Number(process.env.APP_PORT) || 3000,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(
      `Server is running on http://${process.env.APP_HOST}:${process.env.APP_PORT}`,
    )

    if (enableDocs) {
      console.log(
        `Swagger docs available at http://${process.env.APP_HOST}:${process.env.APP_PORT}/docs`,
      )
    }
  })

export default app
