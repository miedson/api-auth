import type { EmailVerificationCodeRepository } from '@/app/auth/repositories/email-verification-code.repository'
import type { VerifyEmailDto } from '@/app/auth/schemas/verify-email.schema'
import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class VerifyEmail {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationCodeRepository: EmailVerificationCodeRepository,
    private readonly tokenHasher: TokenHasher,
  ) {}

  async execute(input: VerifyEmailDto): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new Error('Invalid verification code')
    }

    const codeHash = this.tokenHasher.hash(input.code)
    const verification = await this.emailVerificationCodeRepository.findValidCode(
      codeHash,
      user.id,
    )

    if (!verification || verification.userId !== user.id) {
      throw new Error('Invalid verification code')
    }

    await this.emailVerificationCodeRepository.markUsed(verification.id)
    await this.userRepository.verifyEmailAndActivate(user.id)
  }
}
