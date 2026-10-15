// app/courses/page.tsx - Courses listing page

import { Metadata } from 'next'
import { CoursesPage } from '@/components/CoursesPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('courses.title'),
    description: t('courses.subtitle'),
  }
}

export default function CoursesListingPage() {
  return <CoursesPage />
}

