import { addMinutes } from 'date-fns'
import { Repository } from '@/app/common/interfaces/repository'
import type { MembershipRole, Prisma, PrismaClient } from '@prisma/client'

export class EmailVerificationCodeRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    userId: number
    applicationId: number
    role: MembershipRole
    codeHash: string
  }): Promise<void> {
    await this.dataSource.emailVerificationCode.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        role: data.role,
        codeHash: data.codeHash,
        expiresAt: addMinutes(new Date(), 10),
      },
    })
  }

  async findValidCode(codeHash: string, applicationId: number) {
    return this.dataSource.emailVerificationCode.findFirst({
      where: {
        codeHash,
        applicationId,
        usedAt: null,
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

  async markUsed(id: string): Promise<void> {
    await this.dataSource.emailVerificationCode.update({
      where: { id },
      data: { usedAt: new Date() },
    })
  }
}
