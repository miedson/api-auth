import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { MeResponseDto } from '@/app/auth/schemas/me-response.schema'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class GetMe {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: {
    userPublicId: string
    applicationSlug: string
  }): Promise<MeResponseDto> {
    const user = await this.userRepository.findByPublicId(input.userPublicId)

    if (!user || user.status !== 'active') {
      throw new Error('Unauthorized')
    }

    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application || application.status !== 'active') {
      throw new Error('Unauthorized')
    }

    const membership = user.memberships.find(
      (item) => item.applicationId === application.id,
    )
    const applicationRole =
      membership?.role ?? (user.role === 'root' ? 'admin' : null)

    if (!applicationRole) {
      throw new Error('Unauthorized')
    }

    return {
      user: {
        id: user.publicId,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
      },
      application: {
        id: application.publicId,
        name: application.name,
        slug: application.slug,
        role: applicationRole,
      },
    }
  }
}
