// components/TopupConfirmDialog.tsx - Order review before the hosted Usage Unit payment

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Lock, X } from 'lucide-react'
import { calculatePriceForTokens, calculateTokens, formatPrice } from '@/lib/currency-utils'
import type { TopupConfirmState } from '@/hooks/use-topup-checkout'
import { EMPTY_CONSENT, OrderConsentFields, OrderFacts, isConsentComplete } from '@/components/OrderConsentFields'

export function TopupConfirmDialog({ request, isSubmitting, onCancel, onConfirm }: TopupConfirmState) {
  const t = useTranslations('topUp.confirm')
  const tUnits = useTranslations('common.buttons')
  const [consent, setConsent] = useState(EMPTY_CONSENT)

  // Each order starts with unticked boxes
  useEffect(() => {
    if (request) setConsent(EMPTY_CONSENT)
  }, [request])

  if (!request) return null

  const units = request.tokens ?? Math.floor(calculateTokens(request.amount ?? 0, request.currency))
  const price = request.tokens ? calculatePriceForTokens(request.tokens, request.currency) : request.amount ?? 0
  const canConfirm = isConsentComplete(consent, false) && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-surface-300 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4">
          <h2 className="font-heading text-base font-semibold text-text-main">{t('title')}</h2>
          <button type="button" onClick={onCancel} className="text-text-muted hover:text-text-main" aria-label={t('cancel')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <OrderFacts
            rows={[
              { label: t('product'), value: request.label ?? t('customProduct') },
              { label: t('units'), value: `${units.toLocaleString('en-US')} ${tUnits('tokens')}` },
              { label: t('total'), value: `${formatPrice(price, request.currency)} ${request.currency}` },
              { label: t('delivery'), value: t('deliveryValue') },
            ]}
          />
          <OrderConsentFields value={consent} onChange={setConsent} requireImmediateSupply={false} />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-surface-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm({ termsAccepted: consent.termsAccepted })}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            {t('pay', { price: formatPrice(price, request.currency) })}
          </button>
        </div>
      </div>
    </div>
  )
}
