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

  return <TopUpSuccessContent />
}

