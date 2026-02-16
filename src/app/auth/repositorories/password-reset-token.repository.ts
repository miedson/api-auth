import { addMinutes } from 'date-fns'
import { Repository } from '@/app/common/interfaces/repository'
import type { Prisma, PrismaClient } from '@prisma/client'

export class PasswordResetTokenRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    userId: number
    applicationId: number
    tokenHash: string
  }): Promise<void> {
    await this.dataSource.passwordResetToken.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        tokenHash: data.tokenHash,
        expiresAt: addMinutes(new Date(), 30),
      },
    })
  }

  async findFirstTokenHash(tokenHash: string, applicationId: number) {
    return this.dataSource.passwordResetToken.findFirst({
      where: {
        tokenHash,
        applicationId,
        expiresAt: {
          gt: new Date(),
        },
        useAt: null,
      },
      include: { user: true },
    })
  }
}
