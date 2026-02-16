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
  const rootName = process.env.SEED_ROOT_NAME
  const rootEmail = process.env.SEED_ROOT_EMAIL
  const rootPassword = process.env.SEED_ROOT_PASSWORD

  if (
    !appSlug ||
    !appName ||
    !clientName ||
    !clientId ||
    !clientSecret ||
    !rootName ||
    !rootEmail ||
    !rootPassword
  ) {
    throw new Error(
      'Missing envs: SEED_APP_SLUG, SEED_APP_NAME, SEED_CLIENT_NAME, SEED_CLIENT_ID, SEED_CLIENT_SECRET, SEED_ROOT_NAME, SEED_ROOT_EMAIL, SEED_ROOT_PASSWORD',
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
  const rootPasswordHash = await bcrypt.hash(rootPassword, 12)

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

  const rootUser = await prisma.user.upsert({
    where: { email: rootEmail },
    update: {
      name: rootName,
      role: 'root',
      status: 'active',
      emailVerifiedAt: new Date(),
      passwordHash: rootPasswordHash,
    },
    create: {
      name: rootName,
      email: rootEmail,
      role: 'root',
      status: 'active',
      emailVerifiedAt: new Date(),
      passwordHash: rootPasswordHash,
    },
  })

  console.log('Seed executed successfully')
  console.log(`application.slug=${application.slug}`)
  console.log(`client.id=${authClient.clientId}`)
  console.log(`root.email=${rootUser.email}`)
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
