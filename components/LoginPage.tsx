'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
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
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — context panel */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between bg-surface-900 px-10 py-12 xl:px-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-700 bg-surface-800">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Avenqor</p>
              <p className="text-[11px] uppercase tracking-widest text-surface-500">Secure Access</p>
            </div>
          </Link>

          <div className="mt-16 max-w-sm">
            <h2 className="font-heading text-2xl font-semibold text-white">
              Your trading education account
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-surface-400">
              Access your courses, token wallet, custom strategies, and learning library — all from one secure dashboard.
            </p>
          </div>

          <ul className="mt-10 space-y-5">
            {[
              { icon: BookOpen, text: 'Curated course library & custom PDFs' },
              { icon: Wallet, text: 'Token wallet with multi-currency support' },
              { icon: GraduationCap, text: 'AI-powered strategy generation' },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-700 bg-surface-800">
                  <Icon className="h-4 w-4 text-brand-400" />
                </div>
                <span className="pt-1.5 text-sm text-surface-300">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-surface-600">
          Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:min-h-0 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
            </div>
            <span className="text-sm font-semibold text-text-main">Avenqor</span>
          </div>

          <div className="mb-8">
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

          {/* Mobile trust strip */}
          <div className="mt-10 border-t border-surface-200 pt-6 lg:hidden">
            <p className="text-center text-xs leading-relaxed text-text-muted">
              Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
