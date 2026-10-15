// app/reset-password/page.tsx - Reset password page

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import { ResetPasswordPage } from '@/components/ResetPasswordPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('auth.resetPassword.title'),
    description: t('auth.resetPassword.subtitle'),
  }
}

export default async function ResetPasswordPageRoute() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return <ResetPasswordPage />
}

