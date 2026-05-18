'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Mail,
  MessageSquare,
  Globe2,
  Clock,
  AlertTriangle,
  HelpCircle,
  FileText,
  User,
  MapPin,
  BookOpenCheck,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(200),
  region: z.string().min(1, 'Region is required'),
  topic: z.string().min(1, 'Topic is required'),
  accountId: z.string().max(100).optional(),
  language: z.string().min(1, 'Language is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
})

type ContactFormData = z.infer<typeof contactFormSchema>

export function ContactPage() {
  const t = useTranslations('contact')
  const tBreadcrumb = useTranslations('courses.breadcrumb')
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      consent: false,
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showToast({
          title: t('form.submit.success'),
          variant: 'success',
        })
        reset()
      } else {
        showToast({
          title: t('form.submit.error'),
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Contact form error:', error)
      showToast({
        title: t('form.submit.error'),
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickNotes = t.raw('hero.quickNotes') as any
  const sideCard = t.raw('hero.sideCard') as any
  const sideInfo = t.raw('sideInfo') as any

  const regions = ['EU', 'UK', 'UAE', 'Other']
  const topics = [
    'Courses',
    'Tokens & billing',
    'Account access',
    'Legal & compliance',
    'Other',
  ]
  const languages = ['English', 'Arabic']

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-5">
      {/* Left — context panel */}
      <div className="hidden bg-surface-900 px-8 py-10 lg:col-span-2 lg:flex lg:flex-col lg:justify-between xl:px-12">
        <div>
          <div className="mb-1 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.contact')}</span>
          </div>

          <div className="mt-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <Mail className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{sideCard?.title}</p>
              <p className="text-xs text-surface-500">{sideCard?.subtitle}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sideCard?.channels?.map((channel: any, idx: number) => {
              const icons = [MessageSquare, Mail, FileText]
              const Icon = icons[idx] || MessageSquare
              return (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                  <div>
                    <p className="font-medium text-surface-200">{channel.title}</p>
                    <p className="text-surface-500">{channel.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {sideCard?.urgentNote && (
            <div className="mt-6 flex items-start gap-2 text-xs text-surface-500">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {sideCard.urgentNote.text}{' '}
                <span className="font-medium text-surface-300">{sideCard.urgentNote.highlight}</span>
                {sideCard.urgentNote.suffix}
              </span>
            </div>
          )}

          {/* Quick notes */}
          <div className="mt-8 space-y-3 border-t border-surface-800 pt-6">
            <div className="flex items-start gap-2 text-xs text-surface-400">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
              <span>
                {quickNotes?.responseWindow?.label}{' '}
                <span className="font-medium text-surface-200">{quickNotes?.responseWindow?.value}</span>.
              </span>
            </div>
            <div className="flex items-start gap-2 text-xs text-surface-400">
              <BookOpenCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
              <span>
                {quickNotes?.faq?.text}{' '}
                <Link href="/faq" className="text-brand-400 underline underline-offset-2 transition hover:text-brand-300">
                  {quickNotes?.faq?.link}
                </Link>{' '}
                {quickNotes?.faq?.suffix}
              </span>
            </div>
            <div className="flex items-start gap-2 text-xs text-surface-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                {quickNotes?.noTrades?.text}{' '}
                <span className="font-medium text-surface-200">{quickNotes?.noTrades?.highlight}</span>
                {quickNotes?.noTrades?.suffix}
              </span>
            </div>
          </div>

          {/* Region info */}
          {sideInfo?.regions && (
            <div className="mt-8 border-t border-surface-800 pt-6">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                <p className="text-xs font-semibold text-surface-200">{sideInfo.regions.title}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sideInfo.regions.items?.map((item: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-surface-700 bg-surface-800 p-2.5">
                    <p className="text-xs font-medium text-surface-200">{item.name}</p>
                    <p className="text-xs text-surface-500">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-surface-600">{sideInfo.regions.note}</p>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-surface-600">
          Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex min-h-screen flex-col justify-start bg-white px-6 py-8 sm:px-10 lg:col-span-3 lg:min-h-0 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-xl">
          {/* Mobile header */}
          <div className="mb-6 lg:hidden">
            <div className="mb-2 flex items-center gap-1 text-xs text-text-muted">
              <Link href="/" className="transition hover:text-text-secondary">{tBreadcrumb('home')}</Link>
              <span className="text-text-muted/50">/</span>
              <span className="text-text-secondary">{t('breadcrumb.contact')}</span>
            </div>
            <h1 className="text-xl font-semibold text-text-main sm:text-2xl">{t('hero.title')}</h1>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('hero.subtitle')}</p>
          </div>

          {/* Desktop title */}
          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-semibold text-text-main">{t('hero.title')}</h1>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('hero.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="mb-4 flex items-center gap-2 border-b border-surface-100 pb-4">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-xs font-semibold text-text-main">{t('form.title')}</p>
                <p className="text-xs text-text-muted">{t('form.subtitle')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('form.fields.fullName.label')}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    id="contact-name"
                    {...register('name')}
                    placeholder={t('form.fields.fullName.placeholder')}
                    className={`input-field w-full rounded-lg py-2.5 pl-11 pr-4 text-sm ${errors.name ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('form.fields.email.label')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    id="contact-email"
                    type="email"
                    {...register('email')}
                    placeholder={t('form.fields.email.placeholder')}
                    className={`input-field w-full rounded-lg py-2.5 pl-11 pr-4 text-sm ${errors.email ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-region" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('form.fields.region.label')}
                </label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <select
                    id="contact-region"
                    {...register('region')}
                    className={`input-field w-full cursor-pointer rounded-lg py-2.5 pl-11 pr-4 text-sm ${errors.region ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  >
                    <option value="">{t('form.fields.region.placeholder')}</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                {errors.region && <p className="mt-1 text-xs text-rose-600">{errors.region.message}</p>}
                <p className="mt-1 text-xs text-text-muted">{t('form.fields.region.hint')}</p>
              </div>

              <div>
                <label htmlFor="contact-topic" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('form.fields.topic.label')}
                </label>
                <div className="relative">
                  <HelpCircle className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <select
                    id="contact-topic"
                    {...register('topic')}
                    className={`input-field w-full cursor-pointer rounded-lg py-2.5 pl-11 pr-4 text-sm ${errors.topic ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  >
                    <option value="">{t('form.fields.topic.placeholder')}</option>
                    {topics.map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>
                </div>
                {errors.topic && <p className="mt-1 text-xs text-rose-600">{errors.topic.message}</p>}
                <p className="mt-1 text-xs text-text-muted">{t('form.fields.topic.hint')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-account" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('form.fields.accountId.label')}
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    id="contact-account"
                    {...register('accountId')}
                    placeholder={t('form.fields.accountId.placeholder')}
                    className="input-field w-full rounded-lg py-2.5 pl-11 pr-4 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">{t('form.fields.accountId.hint')}</p>
              </div>

              <div>
                <label htmlFor="contact-language" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('form.fields.language.label')}
                </label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <select
                    id="contact-language"
                    {...register('language')}
                    className={`input-field w-full cursor-pointer rounded-lg py-2.5 pl-11 pr-4 text-sm ${errors.language ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  >
                    <option value="">{t('form.fields.language.placeholder')}</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                {errors.language && <p className="mt-1 text-xs text-rose-600">{errors.language.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-text-main">
                {t('form.fields.message.label')}
              </label>
              <textarea
                id="contact-message"
                {...register('message')}
                rows={5}
                placeholder={t('form.fields.message.placeholder')}
                className={`input-field w-full resize-none rounded-lg px-4 py-2.5 text-sm ${errors.message ? 'border-rose-400 focus:ring-rose-400' : ''}`}
              />
              {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}
              <div className="mt-1.5 flex items-start gap-2 text-xs text-text-muted">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
                <span>{t('form.warning.text')}</span>
              </div>
            </div>

            {/* Consent */}
            <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
              <label className="flex items-start gap-2.5 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  {...register('consent')}
                  className="mt-0.5 h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span>{t('form.consent.text')}</span>
              </label>
              {errors.consent && <p className="mt-1.5 text-xs text-rose-600">{errors.consent.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold"
            >
              {isSubmitting ? t('form.submit.sending') : t('form.submit.button')}
            </button>
          </form>

          {/* Before you send — mobile only */}
          <div className="mt-8 space-y-4 lg:hidden">
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-brand-600" />
                <p className="text-xs font-semibold text-text-main">{sideInfo?.beforeYouSend?.title}</p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {sideInfo?.beforeYouSend?.items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    • {item.text}{' '}
                    {item.link ? (
                      <Link href="/faq" className="font-medium text-brand-600 underline underline-offset-2">{item.link}</Link>
                    ) : (
                      <>
                        <Link href="/risk-and-disclaimer" className="font-medium text-brand-600 underline underline-offset-2">{item.link1}</Link>{' '}
                        {item.and}{' '}
                        <Link href="/privacy" className="font-medium text-brand-600 underline underline-offset-2">{item.link2}</Link>
                      </>
                    )}{' '}
                    {item.suffix}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Desktop before-you-send sidebar content replicated in left panel */}
          {/* Bottom CTA */}
          <div className="mt-8 flex flex-col items-start justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="text-sm text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/faq" className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold">
                {t('cta.openFaq')}
              </Link>
              <Link href="/resources" className="btn-secondary rounded-lg px-4 py-2 text-xs">
                {t('cta.viewResources')}
              </Link>
            </div>
          </div>

          {/* Mobile trust strip */}
          <div className="mt-6 border-t border-surface-200 pt-4 lg:hidden">
            <p className="text-center text-xs leading-relaxed text-text-muted">
              Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop left panel — before you send info */}
      {/* This content is embedded in the left dark panel above */}
    </div>
  )
}
