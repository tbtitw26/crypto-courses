// app/learn/risk-management/page.tsx - Risk Management Foundations page

import { Metadata } from 'next'
import { Suspense } from 'react'
import { RiskManagementPage } from '@/components/RiskManagementPage'
import { getServerTranslator } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  return {
    title: t('learn.riskManagement.hero.title'),
    description: t('learn.riskManagement.hero.subtitle'),
  }
}

function RiskManagementPageFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-16">
      <main className="pt-6">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-2/3" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RiskManagementPageRoute() {
  return (
    <Suspense fallback={<RiskManagementPageFallback />}>
      <RiskManagementPage />
    </Suspense>
  )
}

