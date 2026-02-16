import type { MembershipRole } from '@prisma/client'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class GrantUserApplicationAccess {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: {
    userPublicId: string
    applicationSlug: string
    role: MembershipRole
  }) {
    const user = await this.userRepository.findByPublicId(input.userPublicId)
    if (!user) {
      throw new Error('User not found')
    }

    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application) {
      throw new Error('Application not found')
    }

    await this.userRepository.attachToApplication(user.id, application.id, input.role)
  }
}
