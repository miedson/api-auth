import { Repository } from '@/app/common/interfaces/repository'
import type { Application, Prisma, PrismaClient } from '@prisma/client'

export class ApplicationRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    name: string
    slug: string
    secretHash: string
  }): Promise<Application> {
    return this.dataSource.application.create({
      data: {
        name: data.name,
        slug: data.slug,
        secretHash: data.secretHash,
        status: 'active',
      },
    })
  }

  async findBySlug(slug: string): Promise<Application | null> {
    return this.dataSource.application.findUnique({ where: { slug } })
  }
}
