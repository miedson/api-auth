type To = {
  name: string
  email: string
}

export type SendEmailDTO = {
  to: To[]
  subject: string
  from: string
  fromName?: string
  text?: string
  html: string
}

export interface MailSender {
  send(data: SendEmailDTO): Promise<void>
}
