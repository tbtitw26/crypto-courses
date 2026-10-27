// components/OrderConsentFields.tsx - Checkout consents (never pre-ticked)

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export interface OrderConsentState {
  termsAccepted: boolean
  immediateSupply: boolean
}

export const EMPTY_CONSENT: OrderConsentState = { termsAccepted: false, immediateSupply: false }

interface OrderConsentFieldsProps {
  value: OrderConsentState
  onChange: (value: OrderConsentState) => void
  /** Digital content supplied straight away (courses, custom courses, AI). Not shown for Usage Unit top-ups. */
  requireImmediateSupply: boolean
}

/** Payload sent to the API; the server rejects orders without it. */
export function consentPayload(value: OrderConsentState, requireImmediateSupply: boolean) {
  return requireImmediateSupply
    ? { termsAccepted: value.termsAccepted, immediateSupply: value.immediateSupply }
    : { termsAccepted: value.termsAccepted }
}

export function isConsentComplete(value: OrderConsentState, requireImmediateSupply: boolean) {
  return value.termsAccepted && (!requireImmediateSupply || value.immediateSupply)
}

export function OrderConsentFields({ value, onChange, requireImmediateSupply }: OrderConsentFieldsProps) {
  const t = useTranslations('common.orderConsent')
  const linkClass = 'font-medium text-brand-700 underline hover:text-brand-800'

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
        <input
          type="checkbox"
          checked={value.termsAccepted}
          onChange={(e) => onChange({ ...value, termsAccepted: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-400 accent-brand-600"
        />
        <span>
          {t('termsBefore')}{' '}
          <Link href="/terms" target="_blank" className={linkClass}>
            {t('termsLink')}
          </Link>{' '}
          {t('termsAnd')}{' '}
          <Link href="/refund-policy" target="_blank" className={linkClass}>
            {t('refundLink')}
          </Link>
          .
        </span>
      </label>

      {requireImmediateSupply ? (
        <label className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            checked={value.immediateSupply}
            onChange={(e) => onChange({ ...value, immediateSupply: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-400 accent-brand-600"
          />
          <span>{t('immediateSupply')}</span>
        </label>
      ) : (
        <p className="text-xs leading-relaxed text-text-muted">{t('topupNotice')}</p>
      )}
    </div>
  )
}

/** Labelled facts shown before payment: product, format, price, delivery. */
export function OrderFacts({ rows }: { rows: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="space-y-2 rounded-lg bg-surface-100 px-4 py-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className="text-text-secondary">{row.label}</dt>
          <dd className="text-right font-semibold text-text-main">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
