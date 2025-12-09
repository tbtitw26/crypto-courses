import { PrismaClient } from '@prisma/client'
import { calculateCoursePriceEur, calculateTokensFromEur } from '@/lib/course-pricing'
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

async function main() {
  const eurRate = currencies.EUR.rate // 1 GBP = eurRate EUR

  const courses = await prisma.course.findMany()

  // First pass: compute prices
  for (const course of courses) {
    const meta = demoMeta.get(course.slug)
    const modules = meta?.modules ?? 8
    const durationMax = meta?.durationMax ?? 12
    const durationMin = meta?.durationMin ?? Math.max(1, durationMax - 4)

    const level = inferLevel(course.level, course.slug)
    const market = inferMarket(course.market, course.slug)

    const priceEur = calculateCoursePriceEur(level, modules, durationMax, course.slug)
    const tokens = calculateTokensFromEur(priceEur)
    const priceGbp = Math.round(priceEur / eurRate)

    await prisma.course.update({
      where: { id: course.id },
      data: {
        level,
        market,
        price_gbp: priceGbp,
        tokens,
        duration_hours_max: durationMax,
        duration_hours_min: durationMin,
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
      // Promote first general course to this level
      const candidate = await prisma.course.findFirst({
        where: { level: 'General' },
        orderBy: { created_at: 'asc' },
      })
      if (candidate) {
        const modules = demoMeta.get(candidate.slug)?.modules ?? 8
        const durationMax = demoMeta.get(candidate.slug)?.durationMax ?? 12
        const durationMin = demoMeta.get(candidate.slug)?.durationMin ?? Math.max(1, durationMax - 4)
        const priceEur = calculateCoursePriceEur(lvl, modules, durationMax, candidate.slug)
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

  console.log('Pricing updated with deterministic formula.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

