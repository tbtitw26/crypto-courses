// app/corefy-mock-hpp/page.tsx - Corefy / Sterling Pay HPP Simulator for local testing

'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { ShieldCheck, CreditCard, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

function CorefyMockHPPContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const invoiceId = searchParams.get('invoiceId') || 'inv_mock_test'
  const reference = searchParams.get('reference') || ''
  const amount = searchParams.get('amount') || '10.00'
  const currency = (searchParams.get('currency') || 'EUR').toUpperCase()
  const returnUrl = searchParams.get('returnUrl') || '/top-up/processing'
  const cancelUrl = searchParams.get('cancelUrl') || '/top-up'

  const [cardNumber] = useState('4111 •••• •••• 1111')
  const [expiry] = useState('12/28')
  const [cardHolder] = useState('TEST USER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const handleSimulatePayment = async (status: 'processed' | 'process_failed') => {
    setIsSubmitting(true)
    setActionMessage(
      status === 'processed'
        ? 'Отправка успешного вебхука в Corefy...'
        : 'Отправка вебхука с ошибкой...'
    )

    try {
      // Send webhook notification to the local endpoint
      const payload = {
        data: {
          id: invoiceId,
          type: 'payment-invoices',
          attributes: {
            status,
            resolution: status === 'processed' ? 'ok' : 'insufficient_funds',
            reference_id: reference,
            amount: Number(amount),
            currency,
            metadata: {
              reference_id: reference,
            },
          },
        },
      }

      await fetch('/api/webhooks/corefy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setActionMessage('Перенаправление на страницу результата...')
      setTimeout(() => {
        router.push(returnUrl)
      }, 700)
    } catch (err: any) {
      console.error('Error simulating Corefy webhook:', err)
      setActionMessage('Перенаправление...')
      router.push(returnUrl)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-white" />
            <div>
              <h2 className="font-semibold text-white text-base">Corefy / Sterling Pay</h2>
              <p className="text-xs text-blue-100">Hosted Payment Page (HPP) • Sandbox</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-blue-700/60 text-blue-200 px-2.5 py-1 rounded-full border border-blue-400/30">
            Local Test
          </span>
        </div>

        {/* Amount & Order details */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/80">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Сумма к оплате</p>
            <div className="text-3xl font-bold text-white tracking-tight">
              {Number(amount).toFixed(2)} {currency}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-2 break-all">
              Ref: <span className="text-slate-300">{reference}</span>
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Invoice ID: <span className="text-slate-400">{invoiceId}</span>
            </p>
          </div>
        </div>

        {/* Virtual Card Preview */}
        <div className="p-6 space-y-5">
          <div className="rounded-xl p-4 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="h-6 w-6 text-blue-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase">Test Card</span>
            </div>
            <div className="font-mono text-lg tracking-wider text-slate-200 mb-3">{cardNumber}</div>
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <div>{cardHolder}</div>
              <div>EXP: {expiry}</div>
            </div>
          </div>

          {actionMessage && (
            <div className="text-xs font-mono text-blue-400 bg-blue-950/50 border border-blue-800/50 p-2.5 rounded-lg flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {actionMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleSimulatePayment('processed')}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Оплатить успешно (Simulate 200 OK)
            </button>

            <button
              onClick={() => handleSimulatePayment('process_failed')}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Имитировать ошибку / отказ (Simulate Failed)
            </button>

            <button
              onClick={() => router.push(cancelUrl)}
              disabled={isSubmitting}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3 w-3" />
              Вернуться назад / Отмена
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-700/60 text-center">
          <p className="text-[11px] text-slate-500">
            Тестовая среда Corefy HPP на <span className="font-mono text-slate-400">http://localhost:1010</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CorefyMockHPPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Загрузка...</div>}>
      <CorefyMockHPPContent />
    </Suspense>
  )
}
