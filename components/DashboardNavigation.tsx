'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  Cpu,
  FileText,
  History,
  Receipt,
  Settings,
} from 'lucide-react'

export function DashboardNavigation() {
  const t = useTranslations('dashboard.navigation')
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: BarChart3, isActive: pathname === '/dashboard' },
    { href: '/dashboard/courses', label: t('myCourses'), icon: BookOpen, isActive: pathname === '/dashboard/courses' },
    { href: '/dashboard/custom-courses', label: t('customCourses'), icon: FileText, isActive: pathname === '/dashboard/custom-courses' },
    { href: '/dashboard/ai-strategies', label: t('aiStrategies'), icon: Cpu, isActive: pathname === '/dashboard/ai-strategies' },
    { href: '/dashboard/transactions', label: t('transactions'), icon: History, isActive: pathname === '/dashboard/transactions' },
    { href: '/dashboard/receipts', label: t('receipts'), icon: Receipt, isActive: pathname === '/dashboard/receipts' },
    { href: '/dashboard/settings', label: t('settings'), icon: Settings, isActive: pathname === '/dashboard/settings' },
  ]

  return (
    <div className="border-b border-surface-200 bg-white">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide py-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-text-muted hover:border-surface-300 hover:text-text-main'
                }`}
              >
                <Icon className={`h-4 w-4 ${item.isActive ? 'text-brand-600' : ''}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
