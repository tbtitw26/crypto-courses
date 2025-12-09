import { PrismaClient } from '@prisma/client'
import {
  calculateCoursePriceEur,
  calculateTokensFromEur,
  getCoursePriceRange,
} from '@/lib/course-pricing'
import { currencies } from '@/lib/currency-config'
import { demoCourses } from '@/src/data/courses'

const prisma = new PrismaClient()

type Level = 'General' | 'Beginner' | 'Intermediate' | 'Advanced'

// Build lookup from demoCourses for modules/duration by slug
const demoMeta = new Map<
  string,
  { modules: number; durationMax: number; durationMin: number; market?: string; level?: string }
>()
for (const c of demoCourses) {
  demoMeta.set(c.slug, {
    modules: c.modules?.length || 8,
    durationMax: c.durationHoursMax || 12,
    durationMin: c.durationHoursMin || Math.max(1, (c.durationHoursMax || 12) - 4),
    market: c.market,
    level: c.level,
  })
}

function inferLevel(level: string, slug: string): Level {
  const normalized = (level || '').trim().toLowerCase()
  if (normalized === 'beginner' || slug.includes('beginner')) return 'Beginner'
  if (normalized === 'advanced' || slug.includes('advanced')) return 'Advanced'
  if (normalized === 'intermediate' || slug.includes('intermediate')) return 'Intermediate'
  return 'General'
}

function inferMarket(market: string, slug: string): string {
  const normalized = (market || '').trim().toLowerCase()
  if (normalized) return normalized[0].toUpperCase() + normalized.slice(1).toLowerCase()
  if (slug.includes('forex')) return 'Forex'
  if (slug.includes('crypto')) return 'Crypto'
  if (slug.includes('binary')) return 'Binary'
  return 'General'
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function buildOffsets(slug: string): number[] {
  const base = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]
  const shift = simpleHash(slug) % base.length
  return [...base.slice(shift), ...base.slice(0, shift)]
}

async function main() {
  const eurRate = currencies.EUR.rate // 1 GBP = eurRate EUR

  const courses = await prisma.course.findMany()

  type ComputedCourse = {
    id: number
    slug: string
    level: Level
    market: string
    priceEur: number
  priceGbp?: number
    durationMax: number
    durationMin: number
  }

  const computed: ComputedCourse[] = []

  // First pass: compute prices
  for (const course of courses) {
    const meta = demoMeta.get(course.slug)
    const modules = meta?.modules ?? 8
    const durationMax = meta?.durationMax ?? 12
    const durationMin = meta?.durationMin ?? Math.max(1, durationMax - 4)

    const level = inferLevel(course.level, course.slug)
    const market = inferMarket(course.market, course.slug)

    const priceEur = calculateCoursePriceEur(level, modules, durationMax, course.slug)
    computed.push({
      id: course.id,
      slug: course.slug,
      level,
      market,
      priceEur,
      durationMax,
      durationMin,
    })
  }

  // Resolve price collisions (EUR level-based ranges)
  const usedPrices = new Set<number>()
  for (const c of computed) {
    const range = getCoursePriceRange(c.level)
    let price = Math.round(c.priceEur)
    if (usedPrices.has(price)) {
      const offsets = buildOffsets(c.slug)
      for (const off of offsets) {
        const candidate = price + off
        if (candidate >= range.min && candidate <= range.max && !usedPrices.has(candidate)) {
          price = candidate
          break
        }
      }
    }
    c.priceEur = price
    usedPrices.add(price)
  }

  // Resolve GBP collisions after rounding (try small EUR nudges)
  const usedGbp = new Set<number>()
  for (const c of computed) {
    const range = getCoursePriceRange(c.level)
    let priceEur = c.priceEur
    let priceGbp = Math.round(priceEur / eurRate)

    if (usedGbp.has(priceGbp)) {
      // Try deterministic offsets first
      const offsets = buildOffsets(c.slug)
      let found = false
      for (const off of offsets) {
        const candEur = priceEur + off
        if (candEur < range.min || candEur > range.max) continue
        const candGbp = Math.round(candEur / eurRate)
        if (!usedGbp.has(candGbp)) {
          priceEur = candEur
          priceGbp = candGbp
          found = true
          break
        }
      }
      // If still collision, broaden search within range
      if (!found) {
        for (let step = 1; step <= 50; step++) {
          const candidates = [priceEur + step, priceEur - step]
          for (const candEur of candidates) {
            if (candEur < range.min || candEur > range.max) continue
            const candGbp = Math.round(candEur / eurRate)
            if (!usedGbp.has(candGbp)) {
              priceEur = candEur
              priceGbp = candGbp
              found = true
              break
            }
          }
          if (found) break
        }
      }
    }

    c.priceEur = priceEur
    c.priceGbp = priceGbp
    usedGbp.add(priceGbp)
  }

  // Persist updates
  for (const c of computed) {
    const tokens = calculateTokensFromEur(c.priceEur)
    const priceGbp = c.priceGbp ?? Math.round(c.priceEur / eurRate)

    await prisma.course.update({
      where: { id: c.id },
      data: {
        level: c.level,
        market: c.market,
        price_gbp: priceGbp,
        tokens,
        duration_hours_max: c.durationMax,
        duration_hours_min: c.durationMin,
      },
    })
  }

  // Ensure we have at least one course per level for homepage picks
  const counts = await prisma.course.groupBy({
    by: ['level'],
    _count: { _all: true },
  })
  const levelsNeeded: Level[] = ['Beginner', 'Intermediate', 'Advanced']
  const have = new Set(counts.map((c) => c.level))

  for (const lvl of levelsNeeded) {
    if (!have.has(lvl)) {
      const candidate = await prisma.course.findFirst({
        where: { level: 'General' },
        orderBy: { created_at: 'asc' },
      })
      if (candidate) {
        const meta = demoMeta.get(candidate.slug)
        const modules = meta?.modules ?? 8
        const durationMax = meta?.durationMax ?? 12
        const durationMin = meta?.durationMin ?? Math.max(1, durationMax - 4)
        const range = getCoursePriceRange(lvl)
        let priceEur = calculateCoursePriceEur(lvl, modules, durationMax, candidate.slug)
        priceEur = Math.min(range.max, Math.max(range.min, priceEur))
        const tokens = calculateTokensFromEur(priceEur)
        const priceGbp = Math.round(priceEur / eurRate)

        await prisma.course.update({
          where: { id: candidate.id },
          data: {
            level: lvl,
            price_gbp: priceGbp,
            tokens,
            duration_hours_max: durationMax,
            duration_hours_min: durationMin,
          },
        })
        have.add(lvl)
      }
    }
  }

  console.log('Pricing updated with deterministic formula and unique EUR prices.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

