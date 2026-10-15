// app/forgot-password/page.tsx - Forgot password page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { ForgotPasswordPage } from '@/components/ForgotPasswordPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('auth.forgotPassword.title'),
    description: t('auth.forgotPassword.subtitle'),
  }
}

export default async function ForgotPasswordPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return <ForgotPasswordPage />
}

