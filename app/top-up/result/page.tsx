import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import TopUpSuccessContent from '@/components/TopUpSuccessContent'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('common.meta.topUpResult')} | Cur Nova`,
    description: t('common.meta.topUpResultDesc'),
  }
}

export default async function TopUpResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getServerSession(authOptions)
  const resolvedSearchParams = await searchParams
  const reference = typeof resolvedSearchParams.reference === 'string' ? resolvedSearchParams.reference : ''
  const callbackUrl = `/top-up/result${reference ? `?reference=${encodeURIComponent(reference)}` : ''}`

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const t = await getServerTranslator()

  return (
    <div className="min-h-screen">
      <section className="bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-8 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
            {t('common.meta.paymentStatus')}
          </h1>
          <p className="mt-1 text-sm text-surface-400">
            {t('common.meta.topUpResultDesc')}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
        <TopUpSuccessContent />
      </main>
    </div>
  )
}
