import { randomBytes } from 'node:crypto'
import type { CreateAuthClientDto } from '@/app/admin/schemas/create-auth-client.schema'
import type { AuthClientRepository } from '@/app/client/repositories/auth-client.repository'
import type { PasswordHasher } from '@/app/common/interfaces/password-hasher'

const createRandomClientId = () => `cl_${randomBytes(12).toString('hex')}`
const createRandomClientSecret = () => `cs_${randomBytes(32).toString('base64url')}`

export class CreateAuthClient {
  constructor(
    private readonly authClientRepository: AuthClientRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateAuthClientDto) {
    const clientId = input.clientId ?? createRandomClientId()
    const clientSecret = input.clientSecret ?? createRandomClientSecret()

    const existing = await this.authClientRepository.findByClientId(clientId)
    if (existing) {
      throw new Error('Client ID already exists')
    }

    const clientSecretHash = await this.passwordHasher.hash(clientSecret)

    const created = await this.authClientRepository.create({
      name: input.name,
      clientId,
      clientSecretHash,
    })

    return {
      publicId: created.publicId,
      name: created.name,
      clientId: created.clientId,
      clientSecret,
      status: created.status,
    }
  }
}
