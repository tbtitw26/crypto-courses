// app/dashboard/receipts/page.tsx - Dashboard receipts/invoices page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { ReceiptsPage } from '@/components/ReceiptsPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('dashboard.title')} - ${t('common.meta.receipts')}`,
    description: t('common.meta.receiptsDesc'),
  }
}

export default async function DashboardReceiptsPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/receipts')
  }

  return <ReceiptsPage />
}

