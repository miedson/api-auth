import { randomBytes } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { RefreshTokenRepository } from '@/app/auth/repositories/refresh-token.repository'
import type { AuthResponseDto } from '@/app/auth/schemas/auth-response.schema'
import type { RefreshTokenDto } from '@/app/auth/schemas/refresh-token.schema'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class RefreshSession {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly jwt: FastifyRequest['jwt'],
  ) {}

  async execute(input: RefreshTokenDto): Promise<AuthResponseDto> {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application || application.status !== 'active') {
      throw new Error('Application unavailable')
    }

    const incomingHash = this.tokenHasher.hash(input.refresh_token)
    const stored = await this.refreshTokenRepository.findValidByHash(incomingHash)

    if (!stored || stored.applicationId !== application.id) {
      throw new Error('Invalid refresh token')
    }

    const user = await this.userRepository.findByPublicId(stored.user.publicId)

    if (!user || user.status !== 'active') {
      throw new Error('User unavailable')
    }

    const membership = user.memberships.find(
      (item) => item.applicationId === application.id,
    )

    if (!membership) {
      throw new Error('User has no access to this application')
    }

    await this.refreshTokenRepository.revoke(stored.id)

    const rawRefreshToken = randomBytes(48).toString('hex')
    const refreshTokenHash = this.tokenHasher.hash(rawRefreshToken)

    await this.refreshTokenRepository.create({
      userId: user.id,
      applicationId: application.id,
      tokenHash: refreshTokenHash,
    })

    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m'
    const accessToken = this.jwt.sign(
      {
        sub: user.publicId,
        email: user.email,
        name: user.name,
        applicationSlug: application.slug,
        role: user.role,
      },
      { expiresIn },
    )

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      expires_in: Number(process.env.ACCESS_TOKEN_EXPIRES_SECONDS ?? 900),
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
        role: membership.role,
      },
    }
  }
}
