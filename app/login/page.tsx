// app/login/page.tsx - Login page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { LoginPage } from '@/components/LoginPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('auth.login.title'),
    description: t('auth.login.subtitle'),
  }
}

export default async function LoginPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return <LoginPage />
}

