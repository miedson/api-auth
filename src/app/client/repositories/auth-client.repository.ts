import { Repository } from '@/app/common/interfaces/repository'
import type { Prisma, PrismaClient } from '@prisma/client'

export class AuthClientRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
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
