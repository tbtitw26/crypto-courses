import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const routes = ['/', '/courses', '/pricing', '/learn', '/login']

test.describe('Phase 2 — Desktop header/footer', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const route of routes) {
    test(`${route} — header, footer, no overflow`, async ({ page }) => {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)

      // Header visible
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Logo visible
      const logo = header.locator('img[alt]').first()
      await expect(logo).toBeVisible()

      // Desktop nav visible
      const nav = header.locator('nav[aria-label="Primary navigation"]')
      await expect(nav).toBeVisible()

      // Cart button visible
      const cartBtn = header.locator('a[aria-label="Shopping cart"]').first()
      await expect(cartBtn).toBeVisible()

      // Currency selector visible (the button with currency code text)
      const currencyBtn = header.locator('button:has-text("GBP")').first()
      await expect(currencyBtn).toBeVisible()

      // Language toggle visible (EN button)
      const langToggle = header.locator('button:has-text("EN")').first()
      await expect(langToggle).toBeVisible()

      // Logged-out: Login and Get Started visible
      const loginLink = header.locator('a:has-text("Log")').first()
      await expect(loginLink).toBeVisible()

      // Footer visible
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)

      await page.screenshot({ path: `tests/screenshots/desktop-${route.replace(/\//g, '_') || '_home'}.png`, fullPage: false })
    })
  }
})

test.describe('Phase 2 — Mobile header/footer', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const route of routes) {
    test(`${route} — mobile header, footer, no overflow`, async ({ page }) => {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)

      // Header visible
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Logo visible
      const logo = header.locator('img[alt]').first()
      await expect(logo).toBeVisible()

      // At least one cart button visible on mobile (mobile controls div)
      const cartBtns = header.locator('a[aria-label="Shopping cart"]')
      const count = await cartBtns.count()
      let cartVisible = false
      for (let i = 0; i < count; i++) {
        if (await cartBtns.nth(i).isVisible()) { cartVisible = true; break }
      }
      expect(cartVisible).toBe(true)

      // Desktop nav should be hidden on mobile
      const nav = header.locator('nav[aria-label="Primary navigation"]')
      await expect(nav).toBeHidden()

      // Hamburger menu button visible
      const menuBtn = header.locator('button[aria-controls="mobile-navigation"]')
      await expect(menuBtn).toBeVisible()

      // Footer visible
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)

      await page.screenshot({ path: `tests/screenshots/mobile-${route.replace(/\//g, '_') || '_home'}.png`, fullPage: false })
    })
  }
})

test.describe('Phase 2 — Mobile menu open/close', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('mobile menu opens, shows nav and controls, closes', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const menuBtn = page.locator('button[aria-controls="mobile-navigation"]')
    const mobileNav = page.locator('#mobile-navigation')

    // Menu closed initially
    await expect(mobileNav).toBeHidden()

    // Open menu
    await menuBtn.click()
    await expect(mobileNav).toBeVisible()

    // Currency selector visible in mobile menu
    const currencyLabel = mobileNav.locator('text=Currency').first()
    await expect(currencyLabel).toBeVisible()

    // Language toggle visible in mobile menu
    const langEN = mobileNav.locator('button:has-text("EN")').first()
    await expect(langEN).toBeVisible()

    // Cart link visible in mobile menu
    const cartLink = mobileNav.locator('text=Cart').first()
    await expect(cartLink).toBeVisible()

    // Login/signup buttons visible (logged out)
    const signupBtn = mobileNav.locator('a:has-text("Sign")').first()
    await expect(signupBtn).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/mobile-menu-open.png', fullPage: false })

    // Close menu
    await menuBtn.click()
    await expect(mobileNav).toBeHidden()
  })
})
