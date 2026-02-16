import { addMinutes } from 'date-fns'
import { Repository } from '@/app/common/interfaces/repository'
import type { Prisma, PrismaClient } from '@prisma/client'

export class EmailVerificationCodeRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    userId: number
    codeHash: string
  }): Promise<void> {
    await this.dataSource.emailVerificationCode.create({
      data: {
        userId: data.userId,
        codeHash: data.codeHash,
        expiresAt: addMinutes(new Date(), 10),
      },
    })
  }

  async findValidCode(codeHash: string, userId: number) {
    return this.dataSource.emailVerificationCode.findFirst({
      where: {
        codeHash,
        userId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })
  }

  async markUsed(id: string): Promise<void> {
    await this.dataSource.emailVerificationCode.update({
      where: { id },
      data: { usedAt: new Date() },
    })
  }
}
