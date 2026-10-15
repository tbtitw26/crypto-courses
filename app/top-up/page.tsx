// app/top-up/page.tsx - Top-up page route

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import { TopUpPage } from '@/components/TopUpPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('topUp.title'),
    description: t('topUp.subtitle'),
  }
}

export default async function TopUpPageRoute() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login?callbackUrl=/top-up')
  }

  return <TopUpPage />
}

