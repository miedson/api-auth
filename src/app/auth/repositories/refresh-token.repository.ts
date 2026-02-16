import { addDays } from 'date-fns'
import { Repository } from '@/app/common/interfaces/repository'
import type { Prisma, PrismaClient } from '@prisma/client'

export class RefreshTokenRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    userId: number
    applicationId: number
    tokenHash: string
    ttlDays?: number
  }) {
    return this.dataSource.refreshToken.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        tokenHash: data.tokenHash,
        expiresAt: addDays(new Date(), data.ttlDays ?? 30),
      },
    })
  }

  async findValidByHash(tokenHash: string) {
    return this.dataSource.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
        application: true,
      },
    })
  }

  async revoke(id: string) {
    await this.dataSource.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    })
  }
}
