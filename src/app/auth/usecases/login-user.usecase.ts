import { randomBytes } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import type { PasswordHasher } from '@/app/common/interfaces/password-hasher'
import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { RefreshTokenRepository } from '@/app/auth/repositories/refresh-token.repository'
import type { AuthRequestDto } from '@/app/auth/schemas/auth-request.schema'
import type { AuthResponseDto } from '@/app/auth/schemas/auth-response.schema'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHasher: TokenHasher,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwt: FastifyRequest['jwt'],
  ) {}

  async execute(input: AuthRequestDto): Promise<AuthResponseDto> {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application || application.status !== 'active') {
      throw new Error('Application unavailable')
    }

    const user = await this.userRepository.findByEmail(input.email)
    const passwordValid = user
      ? await this.passwordHasher.compare(input.password, user.passwordHash)
      : false

    if (!user || !passwordValid || user.status !== 'active') {
      throw new Error('Invalid credentials')
    }

    if (!user.emailVerifiedAt) {
      throw new Error('Email not verified')
    }

    const membership = user.memberships.find(
      (item) => item.applicationId === application.id,
    )

    if (!membership) {
      throw new Error('User has no access to this application')
    }

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

    const rawRefreshToken = randomBytes(48).toString('hex')
    const refreshTokenHash = this.tokenHasher.hash(rawRefreshToken)

    await this.refreshTokenRepository.create({
      userId: user.id,
      applicationId: application.id,
      tokenHash: refreshTokenHash,
    })

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
