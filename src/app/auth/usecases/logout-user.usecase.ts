import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { RefreshTokenRepository } from '@/app/auth/repositories/refresh-token.repository'

export class LogoutUser {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenHasher: TokenHasher,
  ) {}

  async execute(input: {
    refreshToken: string
    applicationSlug: string
  }): Promise<void> {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application || application.status !== 'active') {
      return
    }

    const tokenHash = this.tokenHasher.hash(input.refreshToken)
    const stored = await this.refreshTokenRepository.findValidByHash(tokenHash)

    if (stored && stored.applicationId === application.id) {
      await this.refreshTokenRepository.revoke(stored.id)
    }
  }
}
