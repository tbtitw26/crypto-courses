// app/dashboard/courses/page.tsx - Dashboard courses/library page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { LibraryPage } from '@/components/LibraryPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('dashboard.title')} - ${t('common.meta.library')}`,
    description: t('dashboard.libraryPage.subtitle'),
  }
}

export default async function DashboardCoursesPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/courses')
  }

  return <LibraryPage />
}

