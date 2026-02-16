import { randomInt } from 'node:crypto'
import type { UserRole } from '@prisma/client'
import type { EmailVerificationCodeRepository } from '@/app/auth/repositories/email-verification-code.repository'
import type { RegisterResponseDto } from '@/app/auth/schemas/register-response.schema'
import type { PasswordHasher } from '@/app/common/interfaces/password-hasher'
import type { TokenHasher } from '@/app/common/interfaces/token-hasher'
import type { MailSender } from '@/app/common/interfaces/email-sender'
import type { UserRepository } from '@/app/users/repositories/user.repository'
import type { RegisterDto } from '@/app/auth/schemas/register.schema'

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHasher: TokenHasher,
    private readonly mailSender: MailSender,
    private readonly emailVerificationCodeRepository: EmailVerificationCodeRepository,
  ) {}

  private async sendVerificationCode(input: {
    userId: number
    userName: string
    userEmail: string
  }): Promise<void> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const codeHash = this.tokenHasher.hash(code)

    await this.emailVerificationCodeRepository.create({
      userId: input.userId,
      codeHash,
    })

    await this.mailSender.send({
      from: 'no-reply',
      to: [{ name: input.userName, email: input.userEmail }],
      subject: 'Codigo de verificacao',
      html: `<p>Seu codigo de verificacao e: <b>${code}</b></p>`,
    })
  }

  async execute(input: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findByEmail(input.email)
    const role: UserRole = input.role

    if (!existingUser) {
      const passwordHash = await this.passwordHasher.hash(input.password)
      const created = await this.userRepository.create({
        name: input.name,
        displayName: input.displayName,
        email: input.email,
        role,
        passwordHash,
        status: 'pending',
        emailVerifiedAt: null,
      })

      await this.sendVerificationCode({
        userId: created.id,
        userName: created.name,
        userEmail: created.email,
      })

      return {
        status: 'verification_required',
        message: 'Verification code sent to email',
      }
    }

    if (existingUser.status === 'suspended') {
      throw new Error('User is suspended')
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      existingUser.passwordHash,
    )

    if (!passwordMatches) {
      throw new Error('Email already registered with another password')
    }

    if (!existingUser.emailVerifiedAt) {
      const passwordHash = await this.passwordHasher.hash(input.password)
      await this.userRepository.updatePendingCredentials(existingUser.id, {
        name: input.name,
        displayName: input.displayName,
        role,
        passwordHash,
      })

      await this.sendVerificationCode({
        userId: existingUser.id,
        userName: input.name,
        userEmail: existingUser.email,
      })

      return {
        status: 'verification_required',
        message: 'Verification code sent to email',
      }
    }

    return {
      status: 'created',
      message: 'Account created successfully',
    }
  }
}
