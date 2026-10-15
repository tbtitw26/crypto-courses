// app/dashboard/ai-strategies/page.tsx - Dashboard AI strategies route

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth-config'
import { AiStrategiesPage } from '@/components/AiStrategiesPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('dashboard.title')} - ${t('common.meta.aiStrategies')}`,
    description: t('dashboard.aiStrategiesPage.subtitle'),
  }
}

export default async function DashboardAiStrategiesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login?callbackUrl=/dashboard/ai-strategies')
  }

  return <AiStrategiesPage />
}


