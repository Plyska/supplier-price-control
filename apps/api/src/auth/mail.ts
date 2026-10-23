import nodemailer from 'nodemailer'
import type { Environment } from '../config/env.js'
import type { SendLoginMail } from './auth.js'

export function createLoginMailer(env: Environment): SendLoginMail {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    requireTLS: env.NODE_ENV === 'production' && !env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  return async ({ email, url }) => {
    await transport.sendMail({
      from: env.MAIL_FROM,
      to: email,
      subject: 'Price Control — Вхід / Sign in',
      text: `Щоб увійти, відкрийте посилання та підтвердьте вхід. Воно діє 10 хвилин і лише один раз. Якщо ви не запитували вхід, проігноруйте лист.\n\nOpen this link and confirm to sign in. It expires in 10 minutes and can be used once. If you did not request this, ignore this email.\n\n${url}`,
    })
  }
}
