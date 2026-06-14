// components/HomeSection.tsx - Home section wrapper with animation

'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface HomeSectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function HomeSection({ children, className = '', id }: HomeSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id={id} className="w-full max-w-page mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  )
}

