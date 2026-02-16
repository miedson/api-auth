import bcrypt from 'bcrypt'
import type { Application } from '@prisma/client'
import type { AuthClientRepository } from '@/app/client/repositories/auth-client.repository'

export class EnsureClientApplicationAccess {
  constructor(private readonly authClientRepository: AuthClientRepository) {}

  async execute(input: {
    clientId: string
    clientSecret: string
    application: Application
  }): Promise<void> {
    const client = await this.authClientRepository.findByClientId(input.clientId)

    if (!client || client.status !== 'active') {
      throw new Error('Invalid client credentials')
    }

    const validSecret = await bcrypt.compare(
      input.clientSecret,
      client.clientSecretHash,
    )

    if (!validSecret) {
      throw new Error('Invalid client credentials')
    }

    const hasAccess = client.applications.some(
      (item) => item.applicationId === input.application.id,
    )

    if (!hasAccess) {
      throw new Error('Client has no access to this application')
    }
  }
}
