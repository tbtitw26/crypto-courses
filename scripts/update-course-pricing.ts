import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'General'
type Market = 'Forex' | 'Crypto' | 'Binary' | 'General'

function inferLevel(slug: string): Level {
  const s = slug.toLowerCase()
  if (s.includes('beginner')) return 'Beginner'
  if (s.includes('advanced')) return 'Advanced'
  if (s.includes('intermediate')) return 'Intermediate'
  return 'General'
}

function inferMarket(slug: string): Market {
  const s = slug.toLowerCase()
  if (s.includes('forex')) return 'Forex'
  if (s.includes('crypto')) return 'Crypto'
  if (s.includes('binary')) return 'Binary'
  return 'General'
}

function priceForLevel(level: Level): { price_gbp: number; tokens: number } {
  // Simple tiered pricing: 1 GBP = 100 tokens
  switch (level) {
    case 'Beginner':
      return { price_gbp: 39, tokens: 3900 }
    case 'Intermediate':
      return { price_gbp: 59, tokens: 5900 }
    case 'Advanced':
      return { price_gbp: 79, tokens: 7900 }
    case 'General':
    default:
      return { price_gbp: 49, tokens: 4900 }
  }
}

async function main() {
  const courses = await prisma.course.findMany()
  console.log(`Updating ${courses.length} courses with inferred pricing/levels/markets`)

  for (const course of courses) {
    const level = inferLevel(course.slug)
    const market = inferMarket(course.slug)
    const { price_gbp, tokens } = priceForLevel(level)

    await prisma.course.update({
      where: { id: course.id },
      data: {
        level,
        market,
        price_gbp,
        tokens,
      },
    })
  }

  // Ensure we have at least one course per level marked as featured=false (keep default)
  console.log('Done')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

