import { defineConfig } from 'prisma/config'

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.POSTGRES_USER &&
  process.env.POSTGRES_PASSWORD &&
  process.env.POSTGRES_DB
    ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${
        process.env.POSTGRES_HOST ?? 'postgres'
      }:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB}`
    : undefined)

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required (or provide POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)',
  )
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
