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
  const rootName = process.env.SEED_ROOT_NAME
  const rootEmail = process.env.SEED_ROOT_EMAIL
  const rootPassword = process.env.SEED_ROOT_PASSWORD

  if (!rootName || !rootEmail || !rootPassword) {
    throw new Error(
      'Missing envs: SEED_ROOT_NAME, SEED_ROOT_EMAIL, SEED_ROOT_PASSWORD',
    )
  }

  const rootPasswordHash = await bcrypt.hash(rootPassword, 12)

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
