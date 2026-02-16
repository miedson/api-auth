import { Repository } from '@/app/common/interfaces/repository'
import type { AuthClient, Prisma, PrismaClient } from '@prisma/client'

export class AuthClientRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    name: string
    clientId: string
    clientSecretHash: string
  }): Promise<AuthClient> {
    return this.dataSource.authClient.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        clientSecretHash: data.clientSecretHash,
        status: 'active',
      },
    })
  }

  async findByClientId(clientId: string) {
    return this.dataSource.authClient.findUnique({
      where: { clientId },
      include: {
        applications: {
          include: {
            application: true,
          },
        },
      },
    })
  }

  async grantApplicationAccess(
    authClientId: number,
    applicationId: number,
  ): Promise<void> {
    await this.dataSource.clientApplicationAccess.upsert({
      where: {
        authClientId_applicationId: {
          authClientId,
          applicationId,
        },
      },
      update: {},
      create: {
        authClientId,
        applicationId,
      },
    })
  }

  async hasApplicationAccess(clientId: string, applicationId: number) {
    const access = await this.dataSource.clientApplicationAccess.findFirst({
      where: {
        authClient: { clientId },
        applicationId,
      },
    })

    return Boolean(access)
  }
}
