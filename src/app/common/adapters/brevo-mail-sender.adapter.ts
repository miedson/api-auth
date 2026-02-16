import type { MailSender, SendEmailDTO } from '../interfaces/email-sender'

type BrevoRecipient = {
  email: string
  name?: string
}

type BrevoPayload = {
  sender: {
    email: string
    name?: string
  }
  to: BrevoRecipient[]
  replyTo: {
    email: string
    name?: string
  }
  subject: string
  htmlContent: string
  textContent?: string
}

export class BrevoMailSenderAdapter implements MailSender {
  private readonly apiKey: string
  private readonly domain: string

  constructor() {
    const apiKey = process.env['BREVO_API_KEY']
    const domain = process.env['DOMAIN']

    if (!apiKey || !domain) {
      throw new Error('BREVO_API_KEY or DOMAIN is undefined, verify .env')
    }

    this.apiKey = apiKey
    this.domain = domain
  }

  async send(data: SendEmailDTO): Promise<void> {
    const fromEmail = `${data.from}@${this.domain}`

    const payload: BrevoPayload = {
      sender: {
        email: fromEmail,
        name: data.fromName,
      },
      to: data.to.map(({ email, name }) => ({
        email,
        name,
      })),
      replyTo: {
        email: fromEmail,
        name: data.fromName,
      },
      subject: data.subject,
      htmlContent: data.html,
      textContent: data.text,
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const responseBody = await response.text()
      throw new Error(`Brevo send failed: HTTP ${response.status} - ${responseBody}`)
    }
  }
}
