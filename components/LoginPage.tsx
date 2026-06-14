'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  Lock,
  Mail,
  Wallet,
} from 'lucide-react'

export function LoginPage() {
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common.auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl)
    }
  }, [status, session, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('errors.invalidCredentials'))
        setIsLoading(false)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError(t('errors.generic'))
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {/* Decorative gradient band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-400" />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Brand mark */}
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
          <span className="relative block h-9 w-9">
            <Image src="/logo-mini.png" alt="Avenqor" fill sizes="36px" className="object-contain" />
          </span>
          <span className="text-lg font-semibold text-text-main">Avenqor</span>
        </Link>

        {/* Card */}
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">{t('subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-main">
                {t('email')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field w-full pl-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-text-main">
                  {t('password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field w-full pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : t('submit')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            {t('noAccount')}{' '}
            <Link href="/register" className="font-medium text-brand-600 transition-colors hover:text-brand-700">
              {t('signUp')}
            </Link>
          </p>

          {/* Trust strip */}
          <div className="mt-10 flex items-center justify-center gap-6 border-t border-surface-200 pt-6">
            {[
              { icon: BookOpen, text: 'Courses' },
              { icon: Wallet, text: 'Wallet' },
              { icon: BrainCircuit, text: 'AI Strategies' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
                <Icon className="h-3.5 w-3.5 text-surface-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Education disclaimer */}
      <div className="pb-6 text-center">
        <p className="text-[11px] leading-relaxed text-text-muted">
          Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
        </p>
      </div>
    </div>
  )
}
