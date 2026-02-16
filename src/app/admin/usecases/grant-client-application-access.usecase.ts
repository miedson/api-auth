import type { ApplicationRepository } from '@/app/application/repositories/application.repository'
import type { AuthClientRepository } from '@/app/client/repositories/auth-client.repository'

export class GrantClientApplicationAccess {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly authClientRepository: AuthClientRepository,
  ) {}

  async execute(input: { clientId: string; applicationSlug: string }) {
    const client = await this.authClientRepository.findByClientId(input.clientId)
    if (!client) {
      throw new Error('Client not found')
    }

    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    )

    if (!application) {
      throw new Error('Application not found')
    }

    await this.authClientRepository.grantApplicationAccess(
      client.id,
      application.id,
    )
  }
}
