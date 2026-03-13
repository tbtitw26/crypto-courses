import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import TopUpSuccessContent from '@/components/TopUpSuccessContent'

export const metadata: Metadata = {
  title: 'Top-up payment status | Avenqor',
  description: 'Track the status of your token top-up payment.',
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <TopUpSuccessContent />
      </main>
    </div>
  )
}
