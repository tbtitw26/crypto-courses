'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Globe,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react'
import { allowedCountries } from '@/lib/countries'

const STEPS = [
  { key: 'identity', icon: User, label: 'Identity' },
  { key: 'contact', icon: Mail, label: 'Contact' },
  { key: 'address', icon: MapPin, label: 'Address' },
  { key: 'security', icon: Lock, label: 'Security' },
] as const

export function RegisterPage() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const { data: session, status } = useSession()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    if (!phone.trim()) {
      return t('errors.phoneRequired')
    }
    if (!dateOfBirth) {
      return t('errors.dateOfBirthRequired')
    }
    if (Number.isNaN(new Date(`${dateOfBirth}T00:00:00.000Z`).getTime())) {
      return t('errors.dateOfBirthInvalid')
    }
    if (!street.trim()) {
      return t('errors.streetRequired')
    }
    if (!city.trim()) {
      return t('errors.cityRequired')
    }
    if (!country) {
      return t('errors.countryRequired')
    }
    if (!postalCode.trim()) {
      return t('errors.postalCodeRequired')
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
    if (!acceptTerms) {
      return t('errors.consentRequired')
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
          dateOfBirth,
          email,
          phone,
          street,
          city,
          country,
          postalCode,
          password,
          acceptTerms,
        }),
      })

      let data: any = {}
      try {
        const text = await response.text()
        if (text) {
          data = JSON.parse(text)
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        data = {}
      }

      if (!response.ok) {
        if (data.error === 'EMAIL_EXISTS') {
          setError(t('errors.emailExists'))
        } else if (data.error === 'INVALID_EMAIL') {
          setError(t('errors.emailInvalid'))
        } else if (data.error === 'MISSING_REQUIRED_FIELDS') {
          setError(t('errors.completeAllFields'))
        } else if (data.error === 'INVALID_DATE_OF_BIRTH') {
          setError(t('errors.dateOfBirthInvalid'))
        } else if (data.error === 'INVALID_COUNTRY') {
          setError(t('errors.countryInvalid'))
        } else if (data.error === 'TERMS_NOT_ACCEPTED') {
          setError(t('errors.consentRequired'))
        } else if (data.error === 'DATABASE_UNAVAILABLE' || data.error === 'DATABASE_CONFIGURATION_ERROR' || data.error === 'DATABASE_ERROR') {
          setError(t('errors.databaseUnavailable'))
        } else {
          setError(data.message || data.error || t('errors.generic'))
        }
        setIsLoading(false)
        return
      }

      setSuccess(true)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
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
    <div className="relative min-h-screen bg-white">
      {/* Decorative gradient band at top */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50 via-brand-50/40 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-2xl px-6 py-10 sm:px-8 sm:py-14">
        {/* Brand mark */}
        <div className="mb-10 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <span className="relative block h-10 w-10">
              <Image src="/logo-mini.png" alt="Cur Nova" fill sizes="40px" className="object-contain" />
            </span>
            <span className="text-lg font-semibold text-text-main">Cur Nova</span>
          </Link>
        </div>

        {/* Title + subtitle */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">{t('subtitle')}</p>
        </div>

        {/* Step progress indicator */}
        <nav aria-label="Registration sections" className="mb-10">
          <ol className="flex items-center justify-between gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <li key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <div className="h-px flex-1 bg-surface-200" />
                    )}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-brand-50 text-brand-600">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="h-px flex-1 bg-surface-200" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    {step.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t('success')}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Identity */}
          <fieldset className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-text-main">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">1</span>
              <User className="h-4 w-4 text-brand-600" />
              Account Identity
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('firstName')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('lastName')} <span className="text-text-muted">({t('optional')})</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-medium text-text-main">
                {t('dateOfBirth')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <CalendarDays className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="input-field w-full pl-11"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Contact */}
          <fieldset className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-text-main">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">2</span>
              <Mail className="h-4 w-4 text-brand-600" />
              Contact Details
            </legend>
            <div className="mt-4 space-y-4">
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
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('phone')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Phone className="h-4 w-4 text-surface-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="input-field w-full pl-11"
                    placeholder="+44 1234 567890"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section 3: Address */}
          <fieldset className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-text-main">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">3</span>
              <MapPin className="h-4 w-4 text-brand-600" />
              Billing Address
            </legend>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="street" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('street')}
                </label>
                <input
                  id="street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="221B Baker Street"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-text-main">
                    {t('city')}
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="London"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-text-main">
                    {t('postalCode')}
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="NW1 6XE"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('country')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Globe className="h-4 w-4 text-surface-400" />
                  </div>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="input-field w-full appearance-none pl-11"
                  >
                    <option value="" className="text-text-muted">
                      {t('selectCountry')}
                    </option>
                    {allowedCountries.map((countryOption) => (
                      <option key={countryOption.code} value={countryOption.code}>
                        {countryOption.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section 4: Security */}
          <fieldset className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-text-main">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">4</span>
              <Lock className="h-4 w-4 text-brand-600" />
              Security
            </legend>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('password')}
                </label>
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
                    minLength={8}
                    className="input-field w-full pl-11"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">At least 8 characters</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-4 w-4 text-surface-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input-field w-full pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Consent */}
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
            <label className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-surface-300 bg-white accent-brand-600 focus:ring-brand-500"
                required
              />
              <span className="flex-1 leading-relaxed">
                <BadgeCheck className="mr-1.5 inline-block h-4 w-4 text-brand-600" />
                {t.rich('termsConsent', {
                  terms: (chunks) => (
                    <Link href="/terms" className="font-medium text-brand-600 transition-colors hover:text-brand-700">
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="btn-primary w-full"
          >
            {isLoading ? 'Creating account...' : success ? t('success') : t('submit')}
          </button>
        </form>

        {/* Sign-in link */}
        <p className="mt-8 text-center text-sm text-text-secondary">
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-medium text-brand-600 transition-colors hover:text-brand-700">
            {t('signIn')}
          </Link>
        </p>

        {/* Trust features - compact horizontal strip */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: BookOpen, text: 'Curated courses' },
            { icon: Wallet, text: 'Multi-currency wallet' },
            { icon: GraduationCap, text: 'AI strategies' },
            { icon: ShieldCheck, text: 'Secure platform' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-surface-100 bg-surface-50 px-3 py-2.5">
              <Icon className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="text-xs font-medium text-text-secondary">{text}</span>
            </div>
          ))}
        </div>

        {/* Education disclaimer */}
        <p className="mt-8 text-center text-xs leading-relaxed text-text-muted">
          Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
        </p>
      </div>
    </div>
  )
}
