import type { PasswordHasher } from '@/app/common/interfaces/password-hasher'
import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { PasswordResetTokenRepository } from '@/app/auth/repositorories/password-reset-token.repository'
import type { ResetPasswordDto } from '@/app/auth/schemas/reset-password.schema'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class ResetPassword {
  constructor(
    private readonly tokenHasher: TokenHasher,
    private readonly applicationRepository: ApplicationRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordDto): Promise<void> {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application || application.status !== 'active') {
      throw new Error('Application unavailable')
    }

    const tokenHash = this.tokenHasher.hash(input.token)
    const resetToken = await this.passwordResetTokenRepository.findFirstTokenHash(
      tokenHash,
      application.id,
    )

    if (!resetToken) {
      throw new Error('Invalid or expired token')
    }

    const membership = await this.userRepository.findMembership(
      resetToken.userId,
      application.id,
    )

    if (!membership && resetToken.user.role !== 'root') {
      throw new Error('User has no access to this application')
    }

    const newPasswordHash = await this.passwordHasher.hash(input.password)
    await this.userRepository.updatePasswordHash(
      resetToken.id,
      resetToken.userId,
      newPasswordHash,
    )
  }
}
