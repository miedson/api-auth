import { Repository } from '@/app/common/interfaces/repository'
import type { Application, Prisma, PrismaClient } from '@prisma/client'

export class ApplicationRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async findBySlug(slug: string): Promise<Application | null> {
    return this.dataSource.application.findUnique({ where: { slug } })
  }
}
