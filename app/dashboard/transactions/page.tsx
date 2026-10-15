// app/dashboard/transactions/page.tsx - Dashboard transactions/billing page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { BillingPage } from '@/components/BillingPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('dashboard.title')} - ${t('common.meta.billing')}`,
    description: t('dashboard.billingPage.subtitle'),
  }
}

export default async function DashboardTransactionsPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/transactions')
  }

  return <BillingPage />
}

