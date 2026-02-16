import { Repository } from '@/app/common/interfaces/repository'
import type {
  MembershipRole,
  Prisma,
  PrismaClient,
  User,
  UserStatus,
} from '@prisma/client'

type UserWithMemberships = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        application: true
      }
    }
  }
}>

export class UserRepository extends Repository<
  PrismaClient | Prisma.TransactionClient
> {
  async create(data: {
    name: string
    displayName?: string | null
    email: string
    passwordHash: string
    status?: UserStatus
    emailVerifiedAt?: Date | null
  }): Promise<User> {
    return this.dataSource.user.create({ data })
  }

  async updatePendingCredentials(
    userId: number,
    data: {
      name: string
      displayName?: string | null
      passwordHash: string
    },
  ): Promise<void> {
    await this.dataSource.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
      },
    })
  }

  async findByEmail(email: string): Promise<UserWithMemberships | null> {
    return this.dataSource.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            application: true,
          },
        },
      },
    })
  }

  async findByPublicId(publicId: string): Promise<UserWithMemberships | null> {
    return this.dataSource.user.findUnique({
      where: { publicId },
      include: {
        memberships: {
          include: {
            application: true,
          },
        },
      },
    })
  }

  async attachToApplication(
    userId: number,
    applicationId: number,
    role: MembershipRole,
  ): Promise<void> {
    await this.dataSource.userApplication.upsert({
      where: {
        userId_applicationId: {
          userId,
          applicationId,
        },
      },
      update: {
        role,
      },
      create: {
        userId,
        applicationId,
        role,
      },
    })
  }

  async findMembership(userId: number, applicationId: number) {
    return this.dataSource.userApplication.findUnique({
      where: {
        userId_applicationId: {
          userId,
          applicationId,
        },
      },
    })
  }

  async updatePasswordHash(
    tokenId: string,
    userId: number,
    passwordHash: string,
  ): Promise<void> {
    await Promise.all([
      this.dataSource.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.dataSource.passwordResetToken.update({
        where: { id: tokenId },
        data: { useAt: new Date() },
      }),
    ])
  }

  async verifyEmailAndActivate(userId: number): Promise<void> {
    await this.dataSource.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: 'active',
      },
    })
  }
}
