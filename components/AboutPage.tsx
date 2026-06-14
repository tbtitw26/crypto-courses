'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ShieldCheck,
  Info,
  Users,
  Globe2,
  BookOpen,
  Cpu,
  FileText,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Clock,
  Scale,
  Brain,
  LineChart,
  Activity,
  CreditCard,
  ArrowRight,
} from 'lucide-react'

export function AboutPage() {
  const t = useTranslations('about')
  const tBreadcrumb = useTranslations('courses.breadcrumb')

  const profiles = (t.raw('whoIsFor') as any)?.profiles as Array<{
    title: string
    description: string
  }>

  const howWeBuildItems = (t.raw('howWeBuild') as any)?.items as Array<{
    title: string
    description: string
  }>

  const regionsItems = (t.raw('regions') as any)?.items as Array<{
    title: string
    description: string
  }>

  const principlesItems = (t.raw('principles') as any)?.items as Array<{
    title: string
    description: string
  }>

  const neverDoesItems = (t.raw('neverDoes') as any)?.items as string[]

  const whatWeAreItems = (t.raw('hero.sideCard') as any)?.whatWeAre?.items as string[]
  const whatWeAreNotItems = (t.raw('hero.sideCard') as any)?.whatWeAreNot?.items as string[]

  const profileIcons = [Users, Activity, Brain]
  const howWeBuildIcons = [BookOpen, FileText, Cpu]
  const regionsIcons = [Globe2, CreditCard, Users]
  const principlesIcons = [ShieldCheck, Scale, LineChart, Clock]

  return (
    <div className="min-h-screen">
      {/* Hero — full-width, no side panel */}
      <section className="bg-surface-900 pb-16 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.about')}</span>
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800">
              <ShieldCheck className="h-7 w-7 text-brand-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
              {t('hero.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-surface-400 sm:text-base">
              {t('hero.subtitle')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
                <Globe2 className="h-3 w-3 text-brand-400" />
                {t('hero.badges.regions')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
                <MapPin className="h-3 w-3 text-brand-400" />
                {t('hero.badges.markets')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
                <FileText className="h-3 w-3 text-brand-400" />
                {t('hero.badges.format')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What we are / are not — full-width split comparison */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-text-main">{t('hero.sideCard.title')}</p>
              <p className="text-xs text-text-muted">{t('hero.sideCard.subtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {t('hero.sideCard.whatWeAre.label')}
              </p>
              <ul className="space-y-2.5 text-sm leading-relaxed text-emerald-900">
                {whatWeAreItems?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                {t('hero.sideCard.whatWeAreNot.label')}
              </p>
              <ul className="space-y-2.5 text-sm leading-relaxed text-amber-900">
                {whatWeAreNotItems?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who is for — card layout with top-aligned icons */}
      <section className="border-y border-surface-200 bg-surface-50 py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-xl">
            <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('whoIsFor.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('whoIsFor.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {profiles?.map((profile, idx) => {
              const Icon = profileIcons[idx] || Users
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-surface-200 bg-white p-6 shadow-card"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-surface-200 bg-surface-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-main">{profile.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {profile.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How we build — horizontal timeline */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-xl">
            <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('howWeBuild.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('howWeBuild.subtitle')}</p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-5 hidden h-0.5 bg-surface-200 md:block" style={{ width: 'calc(100% - 3rem)' }} />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {howWeBuildItems?.map((item, idx) => {
                const Icon = howWeBuildIcons[idx] || BookOpen
                return (
                  <div key={idx} className="relative flex flex-col items-start">
                    {/* Timeline dot */}
                    <div className="relative z-10 mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-600 bg-white">
                        <span className="text-sm font-bold text-brand-600">{idx + 1}</span>
                      </div>
                      <Icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Regions — badge/pill style */}
      <section className="border-y border-surface-200 bg-surface-50 py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-xl">
            <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('regions.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('regions.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {regionsItems?.map((item, idx) => {
              const Icon = regionsIcons[idx] || Globe2
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-3 rounded-full border border-surface-200 bg-white py-3 pl-3 pr-6 shadow-sm transition hover:border-brand-300 hover:shadow-card"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                    <Icon className="h-4 w-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                    <p className="text-xs text-text-secondary">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Principles — left-aligned list in 2 columns */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-xl font-semibold text-text-main sm:text-2xl">{t('principles.title')}</h2>
          <p className="mb-8 max-w-xl text-sm sm:text-base text-text-secondary">{t('principles.subtitle')}</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {principlesItems?.map((item, idx) => {
              const Icon = principlesIcons[idx] || ShieldCheck
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What never does — gold warning, single column */}
      <section className="border-y border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gold-200 bg-gold-50 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-300 bg-white">
                <AlertTriangle className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-main">{t('neverDoes.title')}</h2>
                <p className="text-xs text-text-muted">{t('neverDoes.subtitle')}</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs leading-relaxed text-text-secondary">
              {neverDoesItems?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/risk-and-disclaimer"
              className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              <span>{t('neverDoes.readMore')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — asymmetric layout */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-xl border border-surface-200 bg-surface-50 p-8 md:flex-row md:items-center md:justify-between">
            <div className="md:max-w-lg">
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link href="/courses" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {t('cta.browseCourses')}
              </Link>
              <Link href="/learn?tab=custom" className="btn-secondary rounded-lg px-5 py-2.5 text-sm">
                {t('cta.requestCustom')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
