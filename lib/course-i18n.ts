// lib/course-i18n.ts - Overlays translated course content (title, description, modules) by slug

import noCourseContent from '@/i18n/no/courseContent.json'
import type { Locale } from '@/i18n/config'

type CourseModule = { order: number; title: string; summary: string }
type CourseTranslation = { title: string; description: string; modules: CourseModule[] }

const courseContent: Partial<Record<Locale, Record<string, CourseTranslation>>> = {
  no: noCourseContent as Record<string, CourseTranslation>,
}

export function getCourseTranslation(slug: string, locale: Locale): CourseTranslation | undefined {
  return courseContent[locale]?.[slug]
}

export function localizeCourse<T extends { slug: string; title: string; description?: string | null; modules?: unknown }>(
  course: T,
  locale: Locale
): T {
  const translation = getCourseTranslation(course.slug, locale)
  if (!translation) return course

  const localized: T = { ...course, title: translation.title }
  if (typeof course.description === 'string') {
    localized.description = translation.description
  }
  if (Array.isArray(course.modules)) {
    const byOrder = new Map(translation.modules.map((m) => [m.order, m]))
    localized.modules = (course.modules as CourseModule[]).map((m) => {
      const tm = byOrder.get(m.order)
      return tm ? { ...m, title: tm.title, summary: tm.summary } : m
    }) as T['modules']
  }
  return localized
}
