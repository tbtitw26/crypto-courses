// components/PathCard.tsx - Learning path card component

'use client'

import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface PathCardProps {
  icon: LucideIcon
  title: string
  text: string
  badge?: string
  cta: string
  href?: string
}

export function PathCard({ icon: Icon, title, text, badge, cta, href = '#' }: PathCardProps) {
  return (
    <div className="group flex flex-col glass-panel rounded-2xl p-5 gap-4 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading text-base font-semibold text-text-main">{title}</h3>
            {badge && (
              <span className="badge-brand">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
        </div>
      </div>
      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
      >
        <span>{cta}</span>
        <span className="inline-block translate-x-0 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
      </Link>
    </div>
  )
}
