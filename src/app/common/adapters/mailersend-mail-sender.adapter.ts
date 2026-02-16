import { EmailParams, MailerSend, Recipient, Sender } from 'mailersend'
import type { MailSender, SendEmailDTO } from '../interfaces/email-sender'

export class MailerSendMailSenderAdapter implements MailSender {
  private apiKey: string | null = null
  private domain: string | null = null

  constructor() {
    const apiKey = process.env['MAILERSEND_API_KEY'] ?? process.env['EMAIL_TOKEN']
    const domain = process.env['DOMAIN']
    if (!apiKey || !domain) {
      throw Error('MAILERSEND_API_KEY (or EMAIL_TOKEN) or DOMAIN undefined, verify .env')
    }
    this.apiKey = apiKey
    this.domain = domain
  }

  async send(data: SendEmailDTO): Promise<void> {
    const mailSend = new MailerSend({ apiKey: this.apiKey! })
    const sentFrom = new Sender(`${data.from}@${this.domain}`, data.fromName)
    const recipients = data.to.map(
      ({ name, email }) => new Recipient(email, name),
    )

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(data.subject)
      .setHtml(data.html)

    await mailSend.email.send(emailParams)
  }
}
