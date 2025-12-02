import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_BRAND_NAME,
  EMAIL_BRAND_LOGO_URL,
  EMAIL_BRAND_LOGO_FILE,
} = process.env

// Determine whether SMTP credentials are configured
const smtpConfigured = Boolean(EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS)

const resolvedPort = Number(EMAIL_PORT)
const resolvedSecure = EMAIL_SECURE
  ? EMAIL_SECURE.toLowerCase() === 'true'
  : resolvedPort === 465 // default to secure for implicit TLS port

const DEFAULT_BRAND_LOGO_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="48"><rect width="200" height="48" rx="12" fill="%231d4ed8"/><text x="100" y="30" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="white">WYZE SUPPORT</text></svg>'

const BRAND_NAME = (EMAIL_BRAND_NAME && EMAIL_BRAND_NAME.trim()) || 'WYZE Support'

const guessMimeType = (filename = '') => {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

const loadPublicLogo = () => {
  try {
    const publicDir = path.resolve(__dirname, '..', '..', 'frontend', 'public')

    // If a specific file is provided via env, prefer that
    if (EMAIL_BRAND_LOGO_FILE && EMAIL_BRAND_LOGO_FILE.trim()) {
      const preferred = path.resolve(publicDir, EMAIL_BRAND_LOGO_FILE.trim())
      if (fs.existsSync(preferred)) {
        const data = fs.readFileSync(preferred)
        const mime = guessMimeType(preferred)
        console.log(`[emailService] Using public logo: ${preferred}`)
        return `data:${mime};base64,${data.toString('base64')}`
      } else {
        console.warn(`[emailService] EMAIL_BRAND_LOGO_FILE set but not found: ${preferred}`)
      }
    }

    // Otherwise, try common filenames
    const candidates = ['wyze-logo.png', 'wyze-logo.jpg', 'wyze-logo.jpeg', 'wyze-logo.svg', 'wyze-logo.webp']
    for (const file of candidates) {
      const fullPath = path.resolve(publicDir, file)
      if (fs.existsSync(fullPath)) {
        const data = fs.readFileSync(fullPath)
        const mime = guessMimeType(fullPath)
        console.log(`[emailService] Using public logo: ${fullPath}`)
        return `data:${mime};base64,${data.toString('base64')}`
      }
    }
  } catch (err) {
    console.warn('[emailService] Failed to embed public logo asset:', err?.message || err)
  }
  return null
}

const BRAND_LOGO_URL = (EMAIL_BRAND_LOGO_URL && EMAIL_BRAND_LOGO_URL.trim()) || loadPublicLogo() || DEFAULT_BRAND_LOGO_URL

const PORTAL_BASE_URL = (() => {
  const raw = process.env.PORTAL_URL || process.env.EMAIL_PORTAL_URL || ''
  const trimmed = raw.trim()
  if (!trimmed) {
    return 'http://localhost:5174'
  }
  return trimmed.replace(/\/$/, '')
})()

let transporter = null

if (smtpConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: resolvedPort || 465,
      secure: resolvedSecure,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })

    // Fire-and-forget verify so we know about misconfiguration early
    transporter
      .verify()
      .then(() => {
        console.log(`[emailService] SMTP transporter ready (host=${EMAIL_HOST}, port=${resolvedPort || 465})`)
      })
      .catch((err) => {
        console.error('[emailService] SMTP transporter verification failed:', err?.message || err)
      })
  } catch (err) {
    console.error('[emailService] Failed to create SMTP transporter:', err?.message || err)
    transporter = null
  }
} else {
  console.warn('[emailService] SMTP not configured. Emails will be logged to the console.')
}

const fallbackLog = ({ to, subject, text }) => {
  const preview = text?.length ? `${text.slice(0, 120)}${text.length > 120 ? '…' : ''}` : ''
  console.log(`[emailService] (stub) ${subject} -> ${to}${preview ? ` | ${preview}` : ''}`)
}

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const autoLink = (value = '') => {
  const safe = escapeHtml(value)
  return safe.replace(/(https?:\/\/[^\s<]+)/gi, (match) => `<a href="${match}" style="color:#2563eb;text-decoration:none;">${match}</a>`)
}

const renderParagraphs = (items = []) => items
  .filter((line) => line != null && line !== '')
  .map((line) => `<p style="margin:0 0 14px;font-size:15px;">${autoLink(String(line))}</p>`)
  .join('')

const formatDetailValue = (value) => {
  if (value == null) return ''
  if (typeof value === 'object' && value.url) {
    const label = value.label || value.url
    const href = escapeHtml(value.url)
    return `<a href="${href}" style="color:#2563eb;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>`
  }
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    const href = escapeHtml(value)
    return `<a href="${href}" style="color:#2563eb;text-decoration:none;font-weight:600;">${href}</a>`
  }
  return escapeHtml(String(value))
}

const renderDetailsTable = (rows = []) => {
  if (!rows.length) return ''
  const cells = rows
    .filter(([label, value]) => label != null && value != null)
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 14px;font-weight:600;color:#0f172a;border-bottom:1px solid #e5e7eb;white-space:nowrap;background:#f8fafc;">${escapeHtml(label)}</td>
        <td style="padding:10px 14px;color:#1f2937;border-bottom:1px solid #e5e7eb;">${formatDetailValue(value)}</td>
      </tr>`)
    .join('')
  if (!cells) return ''
  return `
    <table style="border-collapse:collapse;width:100%;margin:16px 0 20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tbody>${cells}
      </tbody>
    </table>`
}

export const composeEmailHtml = (
  { title, intro = [], details = [], outro = [], footer = [] },
  options = {}
) => {
  const brandName = options.brandName || BRAND_NAME
  const logoUrl = options.logoUrl ?? BRAND_LOGO_URL
  const footerLines = footer.length ? footer : [`${brandName} Team`]

  return `
    <div style="background:#0f172a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 25px 45px rgba(15,23,42,0.25);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0f172a,#1d4ed8 65%,#60a5fa);padding:28px 32px;text-align:left;">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)} logo" style="height:48px;display:block;margin-bottom:18px;border-radius:8px;" />` : ''}
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.4px;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px 32px;color:#1f2937;line-height:1.65;background:#ffffff;">
          ${renderParagraphs(intro)}
          ${renderDetailsTable(details)}
          ${renderParagraphs(outro)}
        </div>
        <div style="background:#f8fafc;padding:16px 32px;color:#6b7280;font-size:13px;border-top:1px solid #e2e8f0;">
          ${renderParagraphs(footerLines)}
        </div>
      </div>
    </div>
  `
}

const buildPortalLink = (path = '') => {
  const normalized = path ? `/${path.replace(/^\/+/, '')}` : ''
  return `${PORTAL_BASE_URL}${normalized}`
}

async function sendMail({ to, subject, text, html }) {
  if (!Array.isArray(to)) {
    to = [to]
  }
  const recipients = to.filter(Boolean)
  if (!recipients.length) {
    return { success: true, skipped: true, reason: 'no recipients' }
  }

  if (!transporter) {
    fallbackLog({ to: recipients.join(', '), subject, text })
    return { success: true, stub: true }
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to: recipients,
      subject,
      text,
      html,
    })
    console.log(`[emailService] Email sent: ${subject} -> ${recipients.join(', ')}`)
    return { success: true }
  } catch (err) {
    console.error('[emailService] Failed to send email:', err?.message || err)
    fallbackLog({ to: recipients.join(', '), subject, text })
    return { success: false, error: err }
  }
}

export async function sendVerificationEmail(to, code, expires) {
  const subject = `Your ${BRAND_NAME} verification code`
  const expiration = expires instanceof Date ? expires.toLocaleString() : String(expires)
  const loginUrl = buildPortalLink('login')
  const text = [
    `Your verification code is ${code}.`,
    `It expires at ${expiration}.`,
    `Sign in at ${loginUrl} after verifying your account.`,
    '',
    `${BRAND_NAME} Team`,
  ].join('\n')

  const html = composeEmailHtml(
    {
      title: 'Verify Your Account',
      intro: [
        'Use the one-time verification code below to finish activating your WYZE Support portal access.',
      ],
      details: [
        ['Verification Code', code],
        ['Expires At', expiration],
        ['Portal', loginUrl],
      ],
      outro: [
        'Enter this code on the verification screen. For your security, do not share it with anyone.',
        'Need help? Reply to this email or reach out to the WYZE IT Support desk.',
      ],
      footer: [
        `${BRAND_NAME}`,
        'This automated message was sent by the WYZE IT Support system.',
      ],
    },
    { logoUrl: BRAND_LOGO_URL, brandName: BRAND_NAME }
  )

  return sendMail({ to, subject, text, html })
}

export async function sendAccountCreatedEmail(to, name) {
  const subject = `Your ${BRAND_NAME} account is ready`
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const timestamp = new Date().toLocaleString()
  const textLines = [
    greeting,
    `Your ${BRAND_NAME} account has been created successfully.`,
    'Please check your inbox for your verification code to activate the account.',
    '',
    `Account email: ${to}`,
    `Created at: ${timestamp}`,
    '',
    `${BRAND_NAME} Team`,
  ]
  const html = composeEmailHtml(
    {
      title: `${BRAND_NAME} Account Created`,
      intro: [
        greeting,
        `Your ${BRAND_NAME} account has been created successfully.`,
        'Please check your inbox for your verification code to activate the account.',
      ],
      details: [
        ['Account Email', to],
        ['Created At', timestamp],
      ],
      outro: ['If you did not request this account, please contact WYZE Support immediately.'],
      footer: [
        `${BRAND_NAME}`,
        'This is an automated message from WYZE IT Support.',
      ],
    },
    { logoUrl: BRAND_LOGO_URL, brandName: BRAND_NAME }
  )

  return sendMail({ to, subject, text: textLines.join('\n'), html })
}

export async function sendAccountProvisionedEmail({ to, name, temporaryPassword, role }) {
  const subject = `Your ${BRAND_NAME} account is ready`
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const loginUrl = buildPortalLink('login')
  const passwordUrl = buildPortalLink('forgot-password')
  const timestamp = new Date().toLocaleString()
  const textLines = [
    greeting,
    `Your ${BRAND_NAME} account has been created by the support team and is ready to use.`,
    'Use the temporary password below to sign in, then update it immediately using the change-password link provided.',
    '',
    `Portal: ${loginUrl}`,
    `Account email: ${to}`,
    role ? `Role: ${role}` : null,
    temporaryPassword ? `Temporary password: ${temporaryPassword}` : null,
    `Created at: ${timestamp}`,
    '',
    `Change password: ${passwordUrl}`,
    '',
    `${BRAND_NAME} Team`,
  ].filter(Boolean)

  const detailRows = [
    ['Portal', loginUrl],
    ['Account Email', to],
    role ? ['Role', role] : null,
    temporaryPassword ? ['Temporary Password', temporaryPassword] : null,
    ['Created At', timestamp],
    ['Change Password', passwordUrl],
  ].filter(Boolean)

  const html = composeEmailHtml(
    {
      title: `${BRAND_NAME} Account Provisioned`,
      intro: [
        greeting,
        `Your ${BRAND_NAME} account has been created by the support team and is ready to use.`,
        'Sign in with the temporary password below, then change it immediately for security.',
      ],
      details: detailRows,
      outro: [
        'Tip: Bookmark the portal link for quick access.',
        'If you did not expect this account, contact WYZE Support immediately.',
      ],
      footer: [
        `${BRAND_NAME}`,
        'This is an automated message from WYZE IT Support.',
      ],
    },
    { logoUrl: BRAND_LOGO_URL, brandName: BRAND_NAME }
  )

  return sendMail({ to, subject, text: textLines.join('\n'), html })
}

export async function sendGeneric(to, subject, body) {
  if (typeof body === 'object' && body !== null) {
    const { text, html } = body
    return sendMail({ to, subject, text, html })
  }
  return sendMail({ to, subject, text: body })
}

export async function sendBulkGeneric(recipients, subject, body) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { success: true, skipped: true, reason: 'no recipients' }
  }
  const unique = [...new Set(recipients.filter(Boolean))]
  if (typeof body === 'object' && body !== null) {
    const { text, html } = body
    const result = await sendMail({ to: unique, subject, text, html })
    return { ...result, count: unique.length }
  }
  const result = await sendMail({ to: unique, subject, text: body })
  return { ...result, count: unique.length }
}
