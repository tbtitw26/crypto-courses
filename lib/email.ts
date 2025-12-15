// lib/email.ts - Email sending utility using nodemailer

import { config } from './config'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

type AttachmentInput = { filename: string; buffer: Buffer; contentType?: string }

async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: AttachmentInput[]
}) {
  if (!resendClient) {
    throw new Error('RESEND_API_KEY is missing; cannot send email')
  }

  const from =
    config.smtp.from && config.smtp.fromName
      ? `"${config.smtp.fromName}" <${config.smtp.from}>`
      : config.smtp.from || 'no-reply@example.com'

  await resendClient.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    reply_to: options.replyTo,
    attachments: options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.buffer.toString('base64'),
      contentType: att.contentType || 'application/pdf',
    })),
  })
}

export interface ContactEmailData {
  name: string
  email: string
  region: string
  topic: string
  accountId?: string
  language: string
  message: string
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  if (!config.smtp.user || !config.smtp.pass) {
    throw new Error('SMTP configuration is missing')
  }

  const subject = `[Avenqor Contact] ${data.topic} - ${data.region}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f172a; color: #e2e8f0; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #1e293b; }
          .value { color: #475569; margin-top: 5px; }
          .message-box { background: #fff; border-left: 3px solid #06b6d4; padding: 15px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${data.name}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${data.email}</div>
            </div>
            <div class="field">
              <div class="label">Region:</div>
              <div class="value">${data.region}</div>
            </div>
            <div class="field">
              <div class="label">Topic:</div>
              <div class="value">${data.topic}</div>
            </div>
            ${data.accountId ? `
            <div class="field">
              <div class="label">Account ID:</div>
              <div class="value">${data.accountId}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Preferred Language:</div>
              <div class="value">${data.language}</div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  const textContent = `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Region: ${data.region}
Topic: ${data.topic}
${data.accountId ? `Account ID: ${data.accountId}\n` : ''}Preferred Language: ${data.language}

Message:
${data.message}
  `.trim()

  await sendEmail({
    to: config.smtp.from,
    replyTo: data.email,
    subject,
    text: textContent,
    html: htmlContent,
  })
}

export interface PasswordResetEmailData {
  email: string
  resetToken: string
  userName?: string
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  if (!config.smtp.user || !config.smtp.pass) {
    throw new Error('SMTP configuration is missing')
  }

  const resetUrl = `${config.nextauth.url}/reset-password?token=${data.resetToken}`
  const subject = 'Reset your Avenqor password'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f172a; color: #e2e8f0; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #06b6d4; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .button:hover { background: #0891b2; }
          .warning { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">Avenqor Password Reset</h2>
          </div>
          <div class="content">
            <p>Hello${data.userName ? ` ${data.userName}` : ''},</p>
            <p>You requested to reset your password for your Avenqor account. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #06b6d4;">${resetUrl}</p>
            <div class="warning">
              <strong>Security notice:</strong> This link is valid for 1 hour and can only be used once. If you did not request a password reset, please ignore this email.
            </div>
            <p>If you have any questions, please contact our support team.</p>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  const textContent = `
Avenqor Password Reset

Hello${data.userName ? ` ${data.userName}` : ''},

You requested to reset your password for your Avenqor account. Use the link below to create a new password:

${resetUrl}

Security notice: This link is valid for 1 hour and can only be used once. If you did not request a password reset, please ignore this email.

If you have any questions, please contact our support team.

This is an automated message. Please do not reply to this email.
  `.trim()

  await sendEmail({
    to: data.email,
    subject,
    text: textContent,
    html: htmlContent,
  })
}

export interface PurchaseEmailData {
  type: 'topup' | 'custom-course' | 'ai-strategy' | 'course'
  transactionId: string // topup-1, custom-1, ai-1, course-1
  userEmail: string
  userName: string
  locale: 'en' | 'ar'
  invoicePdfBuffer?: Buffer // Optional: allow email to be sent without attachment
  invoiceNumber: string
  tokens: number
  amountGbp: number
  newBalance?: number // For topup
  customCourseDeliveryInfo?: boolean // Flag to show delivery info for custom course
}

/**
 * Generate HTML content for purchase confirmation email
 */
function generatePurchaseEmailHtml(data: PurchaseEmailData): string {
  const isArabic = data.locale === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'

  // Translations
  const t = {
    en: {
      subject: 'Purchase Confirmation - Avenqor',
      thankYou: 'Thank you for your purchase!',
      greeting: `Hello ${data.userName},`,
      confirmation: 'Your purchase has been confirmed. Details below:',
      invoiceNumber: 'Invoice Number',
      date: 'Date',
      tokens: 'Tokens',
      amount: 'Amount',
      newBalance: 'New Balance',
      topupDescription: 'Token pack purchase',
      customCourseDescription: 'Custom course request',
      aiStrategyDescription: 'AI strategy generation',
      courseDescription: 'Course purchase',
      customCourseDelivery: 'In the coming days, our trader will send you a personalized course via email.',
      viewDashboard: 'View Dashboard',
      dashboardUrl: `${config.nextauth.url}/dashboard`,
      footer: 'This is an automated message. Please do not reply to this email.',
      support: 'If you have any questions, please contact our support team.',
      educationOnly: 'Education Only – This purchase is for educational content only. Avenqor does not provide trading signals or manage trading accounts.',
    },
    ar: {
      subject: 'تأكيد الشراء - Avenqor',
      thankYou: 'شكراً لك على شرائك!',
      greeting: `مرحباً ${data.userName}،`,
      confirmation: 'تم تأكيد شرائك. التفاصيل أدناه:',
      invoiceNumber: 'رقم الفاتورة',
      date: 'التاريخ',
      tokens: 'الرموز',
      amount: 'المبلغ',
      newBalance: 'الرصيد الجديد',
      topupDescription: 'شراء حزمة الرموز',
      customCourseDescription: 'طلب دورة مخصصة',
      aiStrategyDescription: 'إنشاء استراتيجية ذكاء اصطناعي',
      courseDescription: 'شراء دورة',
      customCourseDelivery: 'في الأيام القادمة، سيرسل لك متداولنا دورة مخصصة عبر البريد الإلكتروني.',
      viewDashboard: 'عرض لوحة التحكم',
      dashboardUrl: `${config.nextauth.url}/dashboard`,
      footer: 'هذه رسالة آلية. يرجى عدم الرد على هذا البريد الإلكتروني.',
      support: 'إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.',
      educationOnly: 'لأغراض تعليمية فقط – هذا الشراء للمحتوى التعليمي فقط. Avenqor لا تقدم إشارات تداول أو تدير حسابات تداول.',
    },
  }

  const translations = t[data.locale]
  const currentDate = new Date().toLocaleDateString(data.locale === 'ar' ? 'ar-SA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let description = translations.topupDescription
  if (data.type === 'custom-course') {
    description = translations.customCourseDescription
  } else if (data.type === 'ai-strategy') {
    description = translations.aiStrategyDescription
  } else if (data.type === 'course') {
    description = translations.courseDescription
  }

  return `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${data.locale}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: ${isArabic ? "'Segoe UI', Tahoma, Arial, sans-serif" : "Arial, sans-serif"}; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background: #f1f5f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .email-wrapper {
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { 
            background: #0f172a; 
            color: #e2e8f0; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #06b6d4;
          }
          .content { 
            background: #ffffff; 
            padding: 30px 20px; 
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #1e293b;
          }
          .thank-you {
            font-size: 20px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 20px;
            text-align: ${textAlign};
          }
          .confirmation-text {
            color: #475569;
            margin-bottom: 30px;
          }
          .details-box {
            background: #f8fafc;
            border-left: ${isArabic ? 'none' : '3px'} solid #06b6d4;
            border-right: ${isArabic ? '3px' : 'none'} solid #06b6d4;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
            text-align: ${textAlign};
          }
          .detail-value {
            color: #1e293b;
            font-weight: 500;
            text-align: ${isArabic ? 'left' : 'right'};
          }
          .delivery-info {
            background: #fef3c7;
            border-left: ${isArabic ? 'none' : '3px'} solid #f59e0b;
            border-right: ${isArabic ? '3px' : 'none'} solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            color: #92400e;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background: #06b6d4; 
            color: #fff; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600;
            transition: background 0.3s;
          }
          .button:hover { 
            background: #0891b2; 
          }
          .footer { 
            background: #f8fafc;
            padding: 20px;
            text-align: center; 
            color: #64748b; 
            font-size: 12px; 
            border-top: 1px solid #e2e8f0;
          }
          .education-notice {
            background: #f1f5f9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 12px;
            color: #64748b;
            text-align: ${textAlign};
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>Avenqor</h1>
            </div>
            <div class="content">
              <div class="greeting">${translations.greeting}</div>
              <div class="thank-you">${translations.thankYou}</div>
              <div class="confirmation-text">${translations.confirmation}</div>
              
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">${translations.invoiceNumber}</span>
                  <span class="detail-value">${data.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">${translations.date}</span>
                  <span class="detail-value">${currentDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">${translations.tokens}</span>
                  <span class="detail-value">${data.tokens > 0 ? '+' : ''}${data.tokens.toLocaleString(data.locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
                ${data.amountGbp > 0 ? `
                <div class="detail-row">
                  <span class="detail-label">${translations.amount}</span>
                  <span class="detail-value">£${data.amountGbp.toFixed(2)}</span>
                </div>
                ` : ''}
                ${data.newBalance !== undefined ? `
                <div class="detail-row">
                  <span class="detail-label">${translations.newBalance}</span>
                  <span class="detail-value">${data.newBalance.toLocaleString(data.locale === 'ar' ? 'ar-SA' : 'en-US')} ${translations.tokens}</span>
                </div>
                ` : ''}
              </div>

              ${data.customCourseDeliveryInfo ? `
              <div class="delivery-info">
                <strong>${translations.customCourseDelivery}</strong>
              </div>
              ` : ''}

              <div class="education-notice">
                ${translations.educationOnly}
              </div>

              <div class="button-container">
                <a href="${translations.dashboardUrl}" class="button">${translations.viewDashboard}</a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">${translations.support}</p>
            </div>
            <div class="footer">
              <p>${translations.footer}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim()
}

export interface CourseDeliveryEmailData {
  type: 'custom-course' | 'ai-strategy'
  userEmail: string
  userName: string
  locale: 'en' | 'ar'
  courseId: string
  pdfBuffers: Array<{ buffer: Buffer; filename: string; language: 'en' | 'ar' }>
}

/**
 * Generate HTML content for course delivery email
 */
function generateCourseDeliveryEmailHtml(data: CourseDeliveryEmailData): string {
  const isArabic = data.locale === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'

  // Translations
  const t = {
    en: {
      subject: 'Your Custom Course is Ready - Avenqor',
      subjectStrategy: 'Your AI Strategy is Ready - Avenqor',
      greeting: `Hello ${data.userName},`,
      thankYou: 'Your course is ready!',
      thankYouStrategy: 'Your strategy is ready!',
      deliveryText: 'Your custom course has been generated and is attached to this email.',
      deliveryTextStrategy: 'Your AI strategy has been generated and is attached to this email.',
      attachmentsInfo: 'You will find the PDF file(s) attached to this email.',
      languagesInfo: 'The course is available in the following languages:',
      viewDashboard: 'View Dashboard',
      dashboardUrl: `${config.nextauth.url}/dashboard`,
      footer: 'This is an automated message. Please do not reply to this email.',
      support: 'If you have any questions, please contact our support team.',
      educationOnly: 'Education Only – This content is for educational purposes only. Avenqor does not provide trading signals or manage trading accounts.',
    },
    ar: {
      subject: 'دورتك المخصصة جاهزة - Avenqor',
      subjectStrategy: 'استراتيجيتك جاهزة - Avenqor',
      greeting: `مرحباً ${data.userName}،`,
      thankYou: 'دورتك جاهزة!',
      thankYouStrategy: 'استراتيجيتك جاهزة!',
      deliveryText: 'تم إنشاء دورتك المخصصة وهي مرفقة بهذا البريد الإلكتروني.',
      deliveryTextStrategy: 'تم إنشاء استراتيجيتك وهي مرفقة بهذا البريد الإلكتروني.',
      attachmentsInfo: 'ستجد ملف (ملفات) PDF مرفقة بهذا البريد الإلكتروني.',
      languagesInfo: 'الدورة متاحة باللغات التالية:',
      viewDashboard: 'عرض لوحة التحكم',
      dashboardUrl: `${config.nextauth.url}/dashboard`,
      footer: 'هذه رسالة آلية. يرجى عدم الرد على هذا البريد الإلكتروني.',
      support: 'إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.',
      educationOnly: 'لأغراض تعليمية فقط – هذا المحتوى لأغراض تعليمية فقط. Avenqor لا تقدم إشارات تداول أو تدير حسابات تداول.',
    },
  }

  const translations = t[data.locale]
  const isStrategy = data.type === 'ai-strategy'
  const subjectText = isStrategy ? translations.subjectStrategy : translations.subject
  const thankYouText = isStrategy ? translations.thankYouStrategy : translations.thankYou
  const deliveryText = isStrategy ? translations.deliveryTextStrategy : translations.deliveryText

  // Build language list
  const languages = data.pdfBuffers.map((pdf) => pdf.language === 'en' ? (isArabic ? 'الإنجليزية' : 'English') : (isArabic ? 'العربية' : 'Arabic'))
  const languagesText = languages.join(isArabic ? ' و ' : ' and ')

  return `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${data.locale}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: ${isArabic ? "'Segoe UI', Tahoma, Arial, sans-serif" : "Arial, sans-serif"}; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background: #f1f5f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .email-wrapper {
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { 
            background: #0f172a; 
            color: #e2e8f0; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #06b6d4;
          }
          .content { 
            background: #ffffff; 
            padding: 30px 20px; 
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #1e293b;
          }
          .thank-you {
            font-size: 20px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 20px;
            text-align: ${textAlign};
          }
          .delivery-text {
            color: #475569;
            margin-bottom: 20px;
          }
          .info-box {
            background: #f8fafc;
            border-left: ${isArabic ? 'none' : '3px'} solid #06b6d4;
            border-right: ${isArabic ? '3px' : 'none'} solid #06b6d4;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
          }
          .info-item {
            margin-bottom: 10px;
            color: #475569;
          }
          .info-item:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #64748b;
            margin-${isArabic ? 'left' : 'right'}: 8px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background: #06b6d4; 
            color: #fff; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600;
            transition: background 0.3s;
          }
          .button:hover { 
            background: #0891b2; 
          }
          .footer { 
            background: #f8fafc;
            padding: 20px;
            text-align: center; 
            color: #64748b; 
            font-size: 12px; 
            border-top: 1px solid #e2e8f0;
          }
          .education-notice {
            background: #f1f5f9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 12px;
            color: #64748b;
            text-align: ${textAlign};
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>Avenqor</h1>
            </div>
            <div class="content">
              <div class="greeting">${translations.greeting}</div>
              <div class="thank-you">${thankYouText}</div>
              <div class="delivery-text">${deliveryText}</div>
              
              <div class="info-box">
                <div class="info-item">
                  <span class="info-label">${translations.attachmentsInfo}</span>
                </div>
                ${data.pdfBuffers.length > 1 ? `
                <div class="info-item">
                  <span class="info-label">${translations.languagesInfo}</span>
                  <span>${languagesText}</span>
                </div>
                ` : ''}
              </div>

              <div class="education-notice">
                ${translations.educationOnly}
              </div>

              <div class="button-container">
                <a href="${translations.dashboardUrl}" class="button">${translations.viewDashboard}</a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">${translations.support}</p>
            </div>
            <div class="footer">
              <p>${translations.footer}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim()
}

/**
 * Send course delivery email with PDF attachments
 */
export async function sendCourseDeliveryEmail(data: CourseDeliveryEmailData): Promise<void> {
  if (!config.smtp.user || !config.smtp.pass) {
    throw new Error('SMTP configuration is missing')
  }

  const isStrategy = data.type === 'ai-strategy'
  const t = {
    en: {
      subject: isStrategy ? 'Your AI Strategy is Ready - Avenqor' : 'Your Custom Course is Ready - Avenqor',
    },
    ar: {
      subject: isStrategy ? 'استراتيجيتك جاهزة - Avenqor' : 'دورتك المخصصة جاهزة - Avenqor',
    },
  }

  const translations = t[data.locale]
  const subject = translations.subject

  const htmlContent = generateCourseDeliveryEmailHtml(data)

  const textContent = `
${subject}

${data.locale === 'ar' ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}

${isStrategy 
  ? (data.locale === 'ar' ? 'استراتيجيتك جاهزة!' : 'Your strategy is ready!')
  : (data.locale === 'ar' ? 'دورتك جاهزة!' : 'Your course is ready!')}

${isStrategy
  ? (data.locale === 'ar' ? 'تم إنشاء استراتيجيتك وهي مرفقة بهذا البريد الإلكتروني.' : 'Your AI strategy has been generated and is attached to this email.')
  : (data.locale === 'ar' ? 'تم إنشاء دورتك المخصصة وهي مرفقة بهذا البريد الإلكتروني.' : 'Your custom course has been generated and is attached to this email.')}

${data.locale === 'ar' ? 'ستجد ملف (ملفات) PDF مرفقة بهذا البريد الإلكتروني.' : 'You will find the PDF file(s) attached to this email.'}

${data.locale === 'ar' ? 'عرض لوحة التحكم:' : 'View Dashboard:'} ${config.nextauth.url}/dashboard

${data.locale === 'ar' ? 'لأغراض تعليمية فقط – هذا المحتوى لأغراض تعليمية فقط. Avenqor لا تقدم إشارات تداول أو تدير حسابات تداول.' : 'Education Only – This content is for educational purposes only. Avenqor does not provide trading signals or manage trading accounts.'}

${data.locale === 'ar' ? 'إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.' : 'If you have any questions, please contact our support team.'}

${data.locale === 'ar' ? 'هذه رسالة آلية. يرجى عدم الرد على هذا البريد الإلكتروني.' : 'This is an automated message. Please do not reply to this email.'}
  `.trim()

  // Build attachments array
  const attachments = data.pdfBuffers.map((pdf) => ({
    filename: pdf.filename,
    buffer: pdf.buffer,
    contentType: 'application/pdf',
  }))

  await sendEmail({
    to: data.userEmail,
    subject,
    text: textContent,
    html: htmlContent,
    attachments,
  })
}

/**
 * Send purchase confirmation email with invoice PDF attachment
 */
export async function sendPurchaseConfirmationEmail(data: PurchaseEmailData): Promise<void> {
  const t = {
    en: {
      subject: 'Purchase Confirmation - Avenqor',
    },
    ar: {
      subject: 'تأكيد الشراء - Avenqor',
    },
  }

  const translations = t[data.locale]
  const subject = translations.subject

  const htmlContent = generatePurchaseEmailHtml(data)

  const textContent = `
${t[data.locale].subject}

Hello ${data.userName},

Thank you for your purchase!

Your purchase has been confirmed. Details:
- Invoice Number: ${data.invoiceNumber}
- Date: ${new Date().toLocaleDateString(data.locale === 'ar' ? 'ar-SA' : 'en-GB')}
- Tokens: ${data.tokens > 0 ? '+' : ''}${data.tokens}
${data.amountGbp > 0 ? `- Amount: £${data.amountGbp.toFixed(2)}\n` : ''}${data.newBalance !== undefined ? `- New Balance: ${data.newBalance} tokens\n` : ''}
${data.customCourseDeliveryInfo ? '\nIn the coming days, our trader will send you a personalized course via email.\n' : ''}

View your dashboard: ${config.nextauth.url}/dashboard

Education Only – This purchase is for educational content only. Avenqor does not provide trading signals or manage trading accounts.

If you have any questions, please contact our support team.

This is an automated message. Please do not reply to this email.
  `.trim()

  const attachments = data.invoicePdfBuffer
    ? [
        {
          filename: `invoice-${data.transactionId}.pdf`,
          buffer: data.invoicePdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    : []

  await sendEmail({
    to: data.userEmail,
    subject,
    text: textContent,
    html: htmlContent,
    attachments,
  })
}

export interface PdfReadyEmailData {
  userEmail: string
  userName: string
  jobId: number
  type: 'custom' | 'ai-strategy'
  title: string
  locale?: 'en' | 'ar'
}

/**
 * Send PDF ready email with download link (no attachment)
 */
export async function sendPdfReadyEmail(data: PdfReadyEmailData): Promise<{ messageId?: string; error?: string }> {
  if (!config.features.emailNotifications) {
    return { error: 'Email notifications disabled' }
  }

  if (!resendClient) {
    return { error: 'RESEND_API_KEY is missing' }
  }

  const appBaseUrl = process.env.APP_BASE_URL || config.site.baseUrl
  const downloadUrl = `${appBaseUrl}/api/download/${data.type}/${data.jobId}`

  const t = {
    en: {
      subject: `Your PDF is ready — ${data.title}`,
      greeting: `Hello ${data.userName},`,
      body: 'Your PDF has been generated and is ready for download.',
      cta: 'Download PDF',
      fallback: `Or copy this link: ${downloadUrl}`,
      footer: 'This is an automated message. Please do not reply to this email.',
    },
    ar: {
      subject: `PDF جاهز — ${data.title}`,
      greeting: `مرحباً ${data.userName},`,
      body: 'تم إنشاء PDF الخاص بك وهو جاهز للتنزيل.',
      cta: 'تنزيل PDF',
      fallback: `أو انسخ هذا الرابط: ${downloadUrl}`,
      footer: 'هذه رسالة آلية. يرجى عدم الرد على هذا البريد الإلكتروني.',
    },
  }

  const locale = data.locale || 'en'
  const translations = t[locale]

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${translations.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Avenqor</h1>
    </div>
    
    <div style="color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 20px 0;">${translations.greeting}</p>
      <p style="margin: 0 0 30px 0;">${translations.body}</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${downloadUrl}" style="display: inline-block; padding: 14px 28px; background-color: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${translations.cta}
        </a>
      </div>
      
      <p style="margin: 30px 0 0 0; font-size: 14px; color: #64748b;">
        ${translations.fallback}
      </p>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">${translations.footer}</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const textContent = `
${translations.subject}

${translations.greeting}

${translations.body}

${translations.cta}: ${downloadUrl}

${translations.footer}
  `.trim()

  try {
    const from = process.env.RESEND_FROM || config.smtp.from || 'no-reply@example.com'
    const result = await resendClient.emails.send({
      from,
      to: data.userEmail,
      subject: translations.subject,
      html: htmlContent,
      text: textContent,
    })

    return { messageId: result.data?.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[sendPdfReadyEmail] Failed to send email:', errorMessage)
    return { error: errorMessage }
  }
}

