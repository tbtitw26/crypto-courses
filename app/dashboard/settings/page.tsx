// app/dashboard/settings/page.tsx - Dashboard settings page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { SettingsPage } from '@/components/SettingsPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('dashboard.title')} - ${t('common.meta.settings')}`,
    description: t('dashboard.settingsPage.subtitle'),
  }
}

export default async function DashboardSettingsPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/settings')
  }

  return <SettingsPage />
}

