import { BrevoMailSenderAdapter } from '@/app/common/adapters/brevo-mail-sender.adapter'
import { MailerSendMailSenderAdapter } from '@/app/common/adapters/mailersend-mail-sender.adapter'
import type { MailSender } from '@/app/common/interfaces/email-sender'

type EmailProvider = 'mailersend' | 'brevo'

export const createMailSenderFromEnv = (): MailSender => {
  const provider = (process.env['EMAIL_PROVIDER'] ?? 'mailersend') as EmailProvider

  switch (provider) {
    case 'mailersend':
      return new MailerSendMailSenderAdapter()
    case 'brevo':
      return new BrevoMailSenderAdapter()
    default:
      throw new Error(
        `Unsupported EMAIL_PROVIDER: ${provider}. Use 'mailersend' or 'brevo'.`,
      )
  }
}
