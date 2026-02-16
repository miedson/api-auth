import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString?.length) {
  throw new Error('DATABASE_URL is not defined')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const appSlug = process.env.SEED_APP_SLUG
  const appName = process.env.SEED_APP_NAME
  const clientName = process.env.SEED_CLIENT_NAME
  const clientId = process.env.SEED_CLIENT_ID
  const clientSecret = process.env.SEED_CLIENT_SECRET

  if (!appSlug || !appName || !clientName || !clientId || !clientSecret) {
    throw new Error(
      'Missing envs: SEED_APP_SLUG, SEED_APP_NAME, SEED_CLIENT_NAME, SEED_CLIENT_ID, SEED_CLIENT_SECRET',
    )
  }

  const application = await prisma.application.upsert({
    where: { slug: appSlug },
    update: {
      name: appName,
      status: 'active',
    },
    create: {
      name: appName,
      slug: appSlug,
      status: 'active',
    },
  })

  const clientSecretHash = await bcrypt.hash(clientSecret, 12)

  const authClient = await prisma.authClient.upsert({
    where: { clientId },
    update: {
      name: clientName,
      clientSecretHash,
      status: 'active',
    },
    create: {
      name: clientName,
      clientId,
      clientSecretHash,
      status: 'active',
    },
  })

  await prisma.clientApplicationAccess.upsert({
    where: {
      authClientId_applicationId: {
        authClientId: authClient.id,
        applicationId: application.id,
      },
    },
    update: {},
    create: {
      authClientId: authClient.id,
      applicationId: application.id,
    },
  })

  console.log('Seed executed successfully')
  console.log(`application.slug=${application.slug}`)
  console.log(`client.id=${authClient.clientId}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
