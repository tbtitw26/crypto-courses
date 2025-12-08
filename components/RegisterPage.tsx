// components/RegisterPage.tsx - Register page component

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { HomeSection } from './HomeSection'

export function RegisterPage() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const { data: session, status } = useSession()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const validateForm = (): string | null => {
    if (!firstName.trim()) {
      return t('errors.firstNameRequired')
    }
    if (!email.trim()) {
      return t('errors.emailRequired')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t('errors.emailInvalid')
    }
    if (!password) {
      return t('errors.passwordRequired')
    }
    if (password.length < 8) {
      return t('errors.passwordTooShort')
    }
    if (!confirmPassword) {
      return t('errors.confirmPasswordRequired')
    }
    if (password !== confirmPassword) {
      return t('errors.passwordsDontMatch')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName: lastName || null,
          email,
          password,
        }),
      })

      // Safely parse JSON response
      let data: any = {}
      try {
        const text = await response.text()
        if (text) {
          data = JSON.parse(text)
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        // If JSON parsing fails, use empty object
        data = {}
      }

      if (!response.ok) {
        if (data.error === 'EMAIL_EXISTS') {
          setError(t('errors.emailExists'))
        } else if (data.error === 'INVALID_EMAIL') {
          setError(t('errors.emailInvalid'))
        } else if (data.error === 'DATABASE_UNAVAILABLE' || data.error === 'DATABASE_CONFIGURATION_ERROR' || data.error === 'DATABASE_ERROR') {
          setError(t('errors.databaseUnavailable'))
        } else {
          setError(data.error || t('errors.generic'))
        }
        setIsLoading(false)
        return
      }

      // Registration successful, sign in automatically
      setSuccess(true)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // If auto sign-in fails, redirect to login
        router.push('/login?registered=true')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError(t('errors.generic'))
      setIsLoading(false)
    }
  }

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  // Don't render if already authenticated (redirect will happen)
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-6">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="pt-6">
        <HomeSection className="pb-6">
          <div className="max-w-md mx-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">{t('title')}</h1>
                <p className="text-sm text-slate-300/90">{t('subtitle')}</p>
              </div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-950/80 border border-slate-900 rounded-2xl p-6 sm:p-8 space-y-5"
              >
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{t('success')}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('firstName')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-100 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('lastName')} <span className="text-slate-500">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-100 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('email')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-100 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-100 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">At least 8 characters</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('confirmPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-100 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading || success}
                    className="w-full py-2.5 px-4 text-sm font-semibold rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating account...' : success ? t('success') : t('submit')}
                  </button>
                </form>

                {/* Sign in link */}
                <div className="text-center text-sm text-slate-400">
                  <span>{t('haveAccount')} </span>
                  <Link href="/login" className="text-cyan-300 hover:text-cyan-200 transition font-medium">
                    {t('signIn')}
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </HomeSection>
      </main>
    </div>
  )
}

