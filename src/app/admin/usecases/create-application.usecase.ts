import { randomBytes } from 'node:crypto'
import type { CreateApplicationDto } from '@/app/admin/schemas/create-application.schema'
import type { PasswordHasher } from '@/app/common/interfaces/password-hasher'
import type { ApplicationRepository } from '@/app/application/repositories/application.repository'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export class CreateApplication {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateApplicationDto) {
    const slug = input.slug ?? slugify(input.name)

    if (!slug.length) {
      throw new Error('Invalid application slug')
    }

    const exists = await this.applicationRepository.findBySlug(slug)
    if (exists) {
      throw new Error('Application slug already exists')
    }

    const secret = randomBytes(32).toString('hex')
    const secretHash = await this.passwordHasher.hash(secret)

    const application = await this.applicationRepository.create({
      name: input.name,
      slug,
      secretHash,
    })

    return {
      application,
      secret,
    }
  }
}
