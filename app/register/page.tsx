// app/register/page.tsx - Register page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { RegisterPage } from '@/components/RegisterPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('auth.register.title'),
    description: t('auth.register.subtitle'),
  }
}

export default async function RegisterPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return <RegisterPage />
}

