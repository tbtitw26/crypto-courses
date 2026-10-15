// app/dashboard/custom-courses/page.tsx - Dashboard custom courses page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { CustomCoursesPage } from '@/components/CustomCoursesPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: `${t('dashboard.title')} - ${t('common.meta.customCourses')}`,
    description: t('dashboard.customCoursesPage.subtitle'),
  }
}

export default async function DashboardCustomCoursesPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/custom-courses')
  }

  return <CustomCoursesPage />
}

