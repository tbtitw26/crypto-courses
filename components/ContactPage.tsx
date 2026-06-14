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

  const channelIcons = [MessageSquare, Mail, FileText]

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero section */}
      <div className="border-b border-surface-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-8 sm:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-1 text-xs text-text-muted">
            <Link href="/" className="transition hover:text-text-secondary">
              {tBreadcrumb('home')}
            </Link>
            <span className="text-text-muted/50">/</span>
            <span className="text-text-secondary">{t('breadcrumb.contact')}</span>
          </div>

          {/* Title + subtitle */}
          <h1 className="text-2xl font-bold text-text-main sm:text-3xl">
            {t('hero.title')}
          </h1>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            {t('hero.subtitle')}
          </p>

          {/* Channel info strip */}
          {sideCard?.channels && (
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
              {sideCard.channels.map((channel: any, idx: number) => {
                const Icon = channelIcons[idx] || MessageSquare
                return (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <Icon className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main">{channel.title}</p>
                      <p className="text-xs text-text-muted">{channel.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
        {/* Before you send callout */}
        {sideInfo?.beforeYouSend && (
          <div className="mb-8 rounded-xl border border-brand-100 bg-brand-50/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-600" />
              <p className="text-sm font-semibold text-text-main">{sideInfo.beforeYouSend.title}</p>
            </div>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              {sideInfo.beforeYouSend.items?.map((item: any, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-brand-400">&#8226;</span>
                  <span>
                    {item.text}{' '}
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
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Form header */}
          <div className="mb-6 flex items-center gap-2 border-b border-surface-100 pb-5">
            <MessageSquare className="h-4 w-4 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-text-main">{t('form.title')}</p>
              <p className="text-xs text-text-muted">{t('form.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name + Email */}
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

            {/* Region + Topic */}
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

            {/* Account ID + Language */}
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

            {/* Message */}
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
        </div>

        {/* Quick notes pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-text-secondary">
            <Clock className="h-3 w-3 text-brand-500" />
            <span>
              {quickNotes?.responseWindow?.label}{' '}
              <span className="font-medium text-text-main">{quickNotes?.responseWindow?.value}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-text-secondary">
            <BookOpenCheck className="h-3 w-3 text-brand-500" />
            <span>
              {quickNotes?.faq?.text}{' '}
              <Link href="/faq" className="font-medium text-brand-600 underline underline-offset-2 transition hover:text-brand-500">
                {quickNotes?.faq?.link}
              </Link>{' '}
              {quickNotes?.faq?.suffix}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-text-secondary">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span>
              {quickNotes?.noTrades?.text}{' '}
              <span className="font-medium text-text-main">{quickNotes?.noTrades?.highlight}</span>
              {quickNotes?.noTrades?.suffix}
            </span>
          </div>
        </div>

        {/* Region info line */}
        {sideInfo?.regions && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 text-xs text-text-muted">
            <MapPin className="h-3 w-3 text-brand-500" />
            <span className="font-medium text-text-secondary">{sideInfo.regions.title}:</span>
            {sideInfo.regions.items?.map((item: any, idx: number) => (
              <span key={idx}>
                {item.name}
                {idx < sideInfo.regions.items.length - 1 && <span className="mx-0.5">·</span>}
              </span>
            ))}
            {sideInfo.regions.note && (
              <span className="ml-1 text-text-muted/70">— {sideInfo.regions.note}</span>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 rounded-xl border border-surface-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
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

        {/* Education disclaimer */}
        <p className="mt-8 pb-8 text-center text-xs leading-relaxed text-text-muted">
          Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
        </p>
      </div>
    </div>
  )
}
