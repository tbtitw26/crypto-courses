// components/TopUpForm.tsx - Top-up form component

'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatPrice, calculateTokens } from '@/lib/currency-utils'
import type { CurrencyConfig } from '@/lib/currency-config'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'

interface TopUpFormProps {
  currency: string
  currencyConfig: CurrencyConfig
  presets: {
    preset1000: { amount: number; tokens: number }
    preset2750: { amount: number; tokens: number }
    preset6000: { amount: number; tokens: number }
  }
}

export default function TopUpForm({ currency, currencyConfig, presets }: TopUpFormProps) {
  const { showToast } = useToast()
  const t = useTranslations('topUp.form')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [tokenEquivalent, setTokenEquivalent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const updateTokenDisplay = useCallback(
    (value: number) => {
      if (isNaN(value) || value <= 0) {
        setTokenEquivalent('')
        return
      }
      const tokens = Math.floor(calculateTokens(value, currency))
      setTokenEquivalent(t('youGet', { tokens: tokens.toLocaleString('en-US') }))
    },
    [currency, t]
  )

  useEffect(() => {
    // Select first preset by default
    if (presets.preset1000) {
      setSelectedPreset('1000')
      setAmount(presets.preset1000.amount.toFixed(2))
      updateTokenDisplay(presets.preset1000.amount)
    }
  }, [presets.preset1000, updateTokenDisplay])

  const sanitize = (value: string) => {
    return String(value).replace(',', '.').replace(/[^\d.]/g, '')
  }

  const handlePresetClick = (presetKey: string) => {
    setSelectedPreset(presetKey)
    setError(null)

    if (presetKey === 'custom') {
      setAmount('')
      setTokenEquivalent('')
    } else {
      const preset = presets[presetKey as keyof typeof presets]
      if (preset) {
        setAmount(preset.amount.toFixed(2))
        updateTokenDisplay(preset.amount)
      }
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitize(e.target.value)
    setAmount(sanitized)
    setSelectedPreset('custom')
    setError(null)

    const numValue = parseFloat(sanitized)
    if (!isNaN(numValue)) {
      updateTokenDisplay(numValue)
    } else {
      setTokenEquivalent('')
    }
  }

  const handleSubmit = async (button: HTMLButtonElement) => {
    const numAmount = parseFloat(sanitize(amount))

    if (isNaN(numAmount) || numAmount < 0.01) {
      const validationMessage = t('invalidAmountMsg')
      setError(validationMessage)
      showToast({
        title: t('invalidAmount'),
        description: validationMessage,
        variant: 'error',
      })
      return
    }

    setIsLoading(true)
    setError(null)
    const originalText = button.textContent

    try {
      button.textContent = t('processing')
      button.disabled = true

      const response = await fetch('/api/topup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          currency: currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.redirectUrl) {
        throw new Error(t('noRedirect'))
      }

      // Redirect to payment gateway
      window.location.href = data.redirectUrl
    } catch (err: any) {
      const message = err.message || t('genericError')
      setError(message)
      showToast({
        title: t('paymentError'),
        description: message,
        variant: 'error',
      })
      button.textContent = originalText || ''
      button.disabled = false
      setIsLoading(false)
    }
  }

  return (
    <>
      <form id="topup-form" className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-main">{t('choosePackage')}</label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handlePresetClick('1000')}
              className={`px-4 py-3 rounded-xl border transition ${
                selectedPreset === '1000'
                  ? 'border-brand-400 bg-surface-200 text-text-main'
                  : 'border-surface-300 glass-panel text-text-secondary hover:border-surface-400'
              }`}
            >
              <div className="font-semibold">{formatPrice(presets.preset1000.amount, currency)}</div>
              <div className="text-sm font-normal mt-1">{t('tokensN', { tokens: '1,000' })}</div>
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('2750')}
              className={`px-4 py-3 rounded-xl border transition ${
                selectedPreset === '2750'
                  ? 'border-brand-400 bg-surface-200 text-text-main'
                  : 'border-surface-300 glass-panel text-text-secondary hover:border-surface-400'
              }`}
            >
              <div className="font-semibold">{formatPrice(presets.preset2750.amount, currency)}</div>
              <div className="text-sm font-normal mt-1">{t('bonus', { tokens: '2,750', percent: 10 })}</div>
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('6000')}
              className={`px-4 py-3 rounded-xl border transition ${
                selectedPreset === '6000'
                  ? 'border-brand-400 bg-surface-200 text-text-main'
                  : 'border-surface-300 glass-panel text-text-secondary hover:border-surface-400'
              }`}
            >
              <div className="font-semibold">{formatPrice(presets.preset6000.amount, currency)}</div>
              <div className="text-sm font-normal mt-1">{t('bonus', { tokens: '6,000', percent: 20 })}</div>
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('custom')}
              className={`px-4 py-3 rounded-xl border transition ${
                selectedPreset === 'custom'
                  ? 'border-brand-400 bg-surface-200 text-text-main'
                  : 'border-surface-300 glass-panel text-text-secondary hover:border-surface-400'
              }`}
            >
              <div className="font-semibold">{t('custom')}</div>
              <div className="text-sm font-normal mt-1">{t('anyAmount')}</div>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="topup-amount" className="block text-sm font-medium text-text-main">
            {t('orCustom')}
          </label>
          <div className="mt-1 relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-text-muted sm:text-sm">{currencyConfig.symbol}</span>
            </div>
            <input
              type="text"
              id="topup-amount"
              value={amount}
              onChange={handleAmountChange}
              inputMode="decimal"
              placeholder="0.01"
              className="input-field block w-full pl-7 pr-12 sm:text-sm rounded-xl"
            />
          </div>
          {tokenEquivalent && (
            <p className="mt-2 text-sm text-center text-text-secondary font-medium">
              {tokenEquivalent}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            type="button"
            id="checkout-button"
            onClick={(e) => handleSubmit(e.currentTarget)}
            disabled={isLoading}
            className="btn-primary w-full flex justify-center py-2.5 px-4 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {t('addTokens')}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 bg-surface-200 border border-rose-500/40 rounded-xl p-3 text-center">
          <p className="text-rose-400 font-medium">{t('error')}</p>
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}
    </>
  )
}
