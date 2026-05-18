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
      {/* Dark editorial hero */}
      <section className="bg-surface-900 pb-12 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.about')}</span>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
                <ShieldCheck className="h-6 w-6 text-brand-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">{t('hero.title')}</h1>
              <p className="max-w-lg text-sm leading-relaxed text-surface-400 sm:text-base">{t('hero.subtitle')}</p>
              <div className="flex flex-wrap gap-2 text-xs">
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

            {/* What we are / are not — side panel */}
            <div className="lg:col-span-2 rounded-xl border border-surface-700 bg-surface-800/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-400" />
                <div>
                  <p className="text-xs font-semibold text-white">{t('hero.sideCard.title')}</p>
                  <p className="text-xs text-surface-500">{t('hero.sideCard.subtitle')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
                  <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('hero.sideCard.whatWeAre.label')}
                  </p>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-surface-400">
                    {whatWeAreItems?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3">
                  <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    {t('hero.sideCard.whatWeAreNot.label')}
                  </p>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-surface-400">
                    {whatWeAreNotItems?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Avenqor is for */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-xl">
            <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('whoIsFor.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('whoIsFor.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {profiles?.map((profile, idx) => {
              const Icon = profileIcons[idx] || Users
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-surface-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">{profile.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{profile.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How we build — numbered process flow */}
      <section className="border-y border-surface-200 bg-surface-50 py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-xl">
            <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('howWeBuild.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('howWeBuild.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-surface-200 bg-surface-200 md:grid-cols-3">
            {howWeBuildItems?.map((item, idx) => {
              const Icon = howWeBuildIcons[idx] || BookOpen
              return (
                <div key={idx} className="flex flex-col gap-3 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-text-secondary">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Regions, currencies, languages */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-xl">
            <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('regions.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('regions.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {regionsItems?.map((item, idx) => {
              const Icon = regionsIcons[idx] || Globe2
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-surface-200 bg-white p-5 shadow-card"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand-600" />
                    <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-text-secondary">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Principles — horizontal strip */}
      <section className="border-y border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-lg font-semibold text-text-main sm:text-xl">{t('principles.title')}</h2>
          <p className="mb-6 max-w-xl text-sm sm:text-base text-text-secondary">{t('principles.subtitle')}</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {principlesItems?.map((item, idx) => {
              const Icon = principlesIcons[idx] || ShieldCheck
              return (
                <div key={idx} className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="text-xs font-semibold text-text-main">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What Avenqor never does — gold warning */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gold-200 bg-gold-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-300 bg-white">
                <AlertTriangle className="h-5 w-5 text-gold-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-main">{t('neverDoes.title')}</h2>
                <p className="text-xs text-text-muted">{t('neverDoes.subtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-xs leading-relaxed text-text-secondary md:grid-cols-2">
              <ul className="space-y-2">
                {neverDoesItems?.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {neverDoesItems?.slice(3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/risk-and-disclaimer"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              <span>{t('neverDoes.readMore')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-card md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
