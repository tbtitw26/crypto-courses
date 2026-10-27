// app/test-corefy/page.tsx - Interactive Test Page for Corefy Integration

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Zap,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  Database,
  Terminal,
} from 'lucide-react'

export default function TestCorefyPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [webhookLog, setWebhookLog] = useState<any>(null)
  const [isSendingWebhook, setIsSendingWebhook] = useState(false)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/test/corefy-status')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSendTestWebhook = async (status: 'processed' | 'process_failed' | 'expired') => {
    try {
      setIsSendingWebhook(true)
      const res = await fetch('/api/test/corefy-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      setWebhookLog(json)
      await fetchStatus()
    } catch (err: any) {
      setWebhookLog({ error: err.message })
    } finally {
      setIsSendingWebhook(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Панель проверки интеграции Corefy / Sterling Pay
              </h1>
              <p className="text-sm text-slate-400">
                Локальное тестирование на <span className="text-blue-400 font-mono">http://localhost:1010</span> без внешнего HTTPS
              </p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить статус
          </button>
        </div>

        {/* Configuration Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Режим работы</span>
            <div className="text-sm font-semibold text-white flex items-center gap-2 mt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {data?.config?.mode || 'Загрузка...'}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Провайдер: <span className="font-mono text-slate-300">{data?.config?.paymentProvider}</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">API Endpoint</span>
            <div className="text-sm font-mono text-blue-300 truncate mt-1">
              {data?.config?.apiUrl || 'https://api.sterling-pay.com'}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Service Code: <span className="font-mono text-slate-300">{data?.config?.serviceCode}</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Ключи доступа</span>
            <div className="flex gap-2 mt-1.5 text-xs">
              <span className={`px-2 py-0.5 rounded font-mono ${data?.config?.accountIdConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                Account: {data?.config?.accountIdConfigured ? 'OK' : 'Mock'}
              </span>
              <span className={`px-2 py-0.5 rounded font-mono ${data?.config?.apiKeyConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                Key: {data?.config?.apiKeyConfigured ? 'OK' : 'Mock'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              При Mock-режиме запросы эмулируются локально без обращения к банку.
            </p>
          </div>
        </div>

        {/* Action Testing Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Flow Testing */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-base">
              <Zap className="h-5 w-5" />
              <span>Шаг 1: Тест сквозного флоу оплаты</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Вы можете проверить полный пользовательский путь: от выбора суммы на странице Top-Up до перехода на HPP шлюз Corefy и возврата.
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/top-up"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-between transition shadow-lg shadow-blue-950/40"
              >
                <span>Перейти на страницу пополнения (/top-up)</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/checkout"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition border border-slate-700"
              >
                <span>Перейти в Checkout корзины (/checkout)</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Step 2: Webhook Simulation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <Send className="h-5 w-5" />
              <span>Шаг 2: Симуляция Webhook от Corefy</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Отправляет подписанный HMAC-SHA256 запрос на роут{' '}
              <code className="text-indigo-300 font-mono">/api/webhooks/corefy</code> для последней транзакции в базе данных.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleSendTestWebhook('processed')}
                disabled={isSendingWebhook}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Webhook: Оплата успешна (status = processed)
              </button>
              <button
                onClick={() => handleSendTestWebhook('process_failed')}
                disabled={isSendingWebhook}
                className="w-full py-2 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Webhook: Ошибка оплаты (status = process_failed)
              </button>
              <button
                onClick={() => handleSendTestWebhook('expired')}
                disabled={isSendingWebhook}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition border border-slate-700 disabled:opacity-50"
              >
                <Clock className="h-3.5 w-3.5" />
                Webhook: Инвойс истек (status = expired)
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Response Log */}
        {webhookLog && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>Ответ Webhook эндпоинта (/api/webhooks/corefy):</span>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
              {JSON.stringify(webhookLog, null, 2)}
            </pre>
          </div>
        )}

        {/* Recent Database Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-base">
              <Database className="h-5 w-5 text-blue-400" />
              <span>Последние транзакции в базе данных (TransferMitTopup)</span>
            </div>
            <span className="text-xs text-slate-500">Показывает до 5 последних записей</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Reference ID</th>
                  <th className="py-2.5 px-3">Invoice / Payment ID</th>
                  <th className="py-2.5 px-3">Сумма</th>
                  <th className="py-2.5 px-3">Токены</th>
                  <th className="py-2.5 px-3">Статус</th>
                  <th className="py-2.5 px-3">Topup ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.recentPayments?.length > 0 ? (
                  data.recentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-200">{p.reference_id}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.payment_id || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {p.amount} {p.currency}
                      </td>
                      <td className="py-2.5 px-3 text-blue-400 font-semibold">{p.tokens}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.state === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : p.state === 'FAILED' || p.state === 'EXPIRED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {p.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{p.topup_id ? `#${p.topup_id}` : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Нет записей в таблице
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
