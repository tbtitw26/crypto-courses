// lib/contact.ts - Public contact details sourced from env

export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || ''

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE.replace(/\s+/g, '')}`

// Substitutes {phone} placeholders in i18n strings; drops lines that
// reference the phone when no number is configured.
export function withContactPhone(items: string[]): string[] {
  if (!CONTACT_PHONE) return items.filter((item) => !item.includes('{phone}'))
  return items.map((item) => item.replace(/\{phone\}/g, CONTACT_PHONE))
}
