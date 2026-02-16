import { randomBytes } from 'node:crypto'
import type { MailSender } from '@/app/common/interfaces/email-sender'
import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { PasswordResetTokenRepository } from '@/app/auth/repositorories/password-reset-token.repository'
import type { ForgotPasswordDto } from '@/app/auth/schemas/forgot-password.schema'
import type { UserRepository } from '@/app/users/repositories/user.repository'

export class ForgotUserPassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly mailSender: MailSender,
    private readonly tokenHasher: TokenHasher,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(input: ForgotPasswordDto): Promise<void> {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application || application.status !== 'active') {
      return
    }

    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      return
    }

    const membership = user.memberships.find(
      (item) => item.applicationId === application.id,
    )

    if (!membership) {
      return
    }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.tokenHasher.hash(rawToken)
    const appHost = process.env.APP_PUBLIC_URL ?? 'http://localhost:3001'
    const link = `${appHost}/reset-password?token=${rawToken}&application=${application.slug}`

    await this.passwordResetTokenRepository.create({
      userId: user.id,
      applicationId: application.id,
      tokenHash,
    })

    await this.mailSender.send({
      from: 'no-reply',
      to: [{ name: user.name, email: user.email }],
      subject: 'Recuperacao de senha',
      html: `<p>Clique no link para redefinir sua senha: ${link}</p>`,
    })
  }
}
