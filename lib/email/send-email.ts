import nodemailer from 'nodemailer'

interface SendOtpEmailOptions {
  to: string
  subject: string
  title: string
  code: string
  purposeText: string
  validityMinutes?: number
}

function getEmailTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587)
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASSWORD || '').replace(/\s+/g, '')
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

  if (!user || !pass) {
    return null
  }

  // Optimize for Gmail if host is gmail or user is gmail
  if (host === 'smtp.gmail.com' || user.endsWith('@gmail.com') || user.endsWith('@googlemail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    })
  }

  if (!host) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

export async function sendOtpEmail({
  to,
  subject,
  title,
  code,
  purposeText,
  validityMinutes = 10,
}: SendOtpEmailOptions): Promise<{ success: boolean; error?: string; sentViaSmtp: boolean }> {
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'digitalmix111@gmail.com'
  
  let from = process.env.EMAIL_FROM || process.env.SMTP_FROM || ''
  if (!from || from.includes('your-email') || from.includes('example.com')) {
    from = `"DigitalMix" <${user}>`
  }

  const transporter = getEmailTransporter()

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: bold; color: #58a6ff; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 600; color: #f0f6fc; margin: 16px 0 8px; }
    .text { font-size: 14px; line-height: 1.6; color: #8b949e; margin: 0 0 20px; }
    .code-box { background: #0d1117; border: 2px dashed #388bfd; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #58a6ff; display: inline-block; }
    .footer { font-size: 12px; color: #6e7681; border-top: 1px solid #21262d; margin-top: 28px; padding-top: 16px; text-align: center; }
    .highlight { color: #f0f6fc; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ DigitalMix</div>
      <h1 class="title">${title}</h1>
      <p class="text">${purposeText}</p>
    </div>
    
    <div class="code-box">
      <div class="otp-code">${code}</div>
    </div>
    
    <p class="text" style="font-size: 13px; text-align: center;">
      This verification code is valid for <span class="highlight">${validityMinutes} minutes</span>. 
      If you did not request this, please ignore this email or secure your account.
    </p>
    
    <div class="footer">
      This is an automated message from DigitalMix. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`

  const textContent = `${title}\n\n${purposeText}\n\nYour 6-digit verification code is: ${code}\n\nThis code expires in ${validityMinutes} minutes.\nIf you did not request this, you can safely ignore this email.`

  if (!transporter) {
    console.log(`\n======================================================`)
    console.log(`[EMAIL DISPATCH - SMTP NOT CONFIGURED]`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Code: ${code}`)
    console.log(`Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to send real emails via SMTP`)
    console.log(`======================================================\n`)

    return {
      success: true,
      sentViaSmtp: false,
    }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[EMAIL DISPATCH - SUCCESS] Sent to ${to}. MessageId: ${info.messageId}`)
    return {
      success: true,
      sentViaSmtp: true,
    }
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH - ERROR] Failed to send email to ${to}:`, err)
    return {
      success: false,
      error: err?.message || 'Failed to send verification email via SMTP server',
      sentViaSmtp: false,
    }
  }
}
