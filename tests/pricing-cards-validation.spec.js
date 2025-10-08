import { test, expect } from '@playwright/test'

test.describe('Pricing Cards - Content Quantity Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded()
  })

  test.describe('Solo Plan (₹1,799/month)', () => {
    test('should display correct plan name and price', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('h3:has-text("Solo")')).toBeVisible()
      await expect(soloCard.locator('text=₹1,799')).toBeVisible()
      await expect(soloCard.locator('text=/month')).toBeVisible()
    })

    test('should display "For Individual Advisors" badge', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('text=For Individual Advisors')).toBeVisible()
    })

    test('should display daily content with checkmarks', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('text=What You Get Daily:')).toBeVisible()
      await expect(soloCard.locator('text=1 WhatsApp message/day (ready to send)')).toBeVisible()
      await expect(soloCard.locator('text=Basic logo branding')).toBeVisible()
      await expect(soloCard.locator('text=SEBI compliance built-in')).toBeVisible()
    })

    test('should display monthly total with cost per asset', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('text=Monthly Total:')).toBeVisible()
      await expect(soloCard.locator('text=30 viral WhatsApp messages')).toBeVisible()
      await expect(soloCard.locator('text=Cost per asset: ₹60')).toBeVisible()
    })

    test('should display features section', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('text=Features:')).toBeVisible()
      await expect(soloCard.locator('text=Daily content generation')).toBeVisible()
      await expect(soloCard.locator('text=WhatsApp-optimized format')).toBeVisible()
      await expect(soloCard.locator('text=Review & approve before sending')).toBeVisible()
      await expect(soloCard.locator('text=24/7 support')).toBeVisible()
    })

    test('should display "Perfect for" section', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('text=Perfect for:')).toBeVisible()
      await expect(soloCard.locator('text=Advisors with <100 clients')).toBeVisible()
    })

    test('should display CTA button with note', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('button:has-text("Start 14-Day Free Trial")')).toBeVisible()
      await expect(soloCard.locator('text=No credit card required')).toBeVisible()
    })
  })

  test.describe('Professional Plan (₹4,499/month)', () => {
    test('should display correct plan name and price', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('h3:has-text("Professional")')).toBeVisible()
      await expect(proCard.locator('text=₹4,499')).toBeVisible()
      await expect(proCard.locator('text=/month')).toBeVisible()
    })

    test('should display "MOST POPULAR" badge with star', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      const badge = proCard.locator('text=⭐ MOST POPULAR - Save 17%')
      await expect(badge).toBeVisible()
    })

    test('should have special ring styling for most popular', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      const ringClass = await proCard.evaluate((el) => {
        return el.className.includes('ring-2 ring-emerald-500')
      })
      expect(ringClass).toBeTruthy()
    })

    test('should display all 3 daily content items', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('text=What You Get Daily:')).toBeVisible()
      await expect(proCard.locator('text=1 LinkedIn post/day (ready to publish)')).toBeVisible()
      await expect(proCard.locator('text=1 WhatsApp message/day (ready to send)')).toBeVisible()
      await expect(proCard.locator('text=1 WhatsApp Status image/day (1080×1920 branded)')).toBeVisible()
      await expect(proCard.locator('text=Advanced logo + color branding')).toBeVisible()
      await expect(proCard.locator('text=SEBI compliance built-in')).toBeVisible()
    })

    test('should display monthly total (90 assets)', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('text=Monthly Total:')).toBeVisible()
      await expect(proCard.locator('text=90 total assets (3 per day)')).toBeVisible()
    })

    test('should show cost comparison with Solo plan', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('text=Cost per asset: ₹50 (vs ₹60 on Solo)')).toBeVisible()
    })

    test('should display enhanced features list', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('text=Features:')).toBeVisible()
      await expect(proCard.locator('text=Everything in Solo, PLUS:')).toBeVisible()
      await expect(proCard.locator('text=Multi-platform (LinkedIn + WhatsApp)')).toBeVisible()
      await expect(proCard.locator('text=Bulk content scheduling')).toBeVisible()
      await expect(proCard.locator('text=Engagement analytics')).toBeVisible()
      await expect(proCard.locator('text=Priority support')).toBeVisible()
      await expect(proCard.locator('text=Custom brand guidelines')).toBeVisible()
    })

    test('should display larger client range', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('text=Perfect for:')).toBeVisible()
      await expect(proCard.locator('text=Advisors with 100-500 clients')).toBeVisible()
    })

    test('should have green CTA button', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      const button = proCard.locator('button:has-text("Start 14-Day Free Trial")')
      await expect(button).toBeVisible()

      const bgGradient = await button.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })
      expect(bgGradient).toContain('gradient')
    })
  })

  test.describe('Enterprise Plan (Custom)', () => {
    test('should display correct plan name and price', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('h3:has-text("Enterprise")')).toBeVisible()
      await expect(enterpriseCard.locator('text=Custom Pricing')).toBeVisible()
    })

    test('should display "For Advisory Firms" badge', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('text=For Advisory Firms')).toBeVisible()
    })

    test('should display "What You Get:" (not Daily)', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('text=What You Get:')).toBeVisible()
    })

    test('should list all enterprise features', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('text=Unlimited content generation')).toBeVisible()
      await expect(enterpriseCard.locator('text=Multi-advisor dashboard')).toBeVisible()
      await expect(enterpriseCard.locator('text=API access for automation')).toBeVisible()
      await expect(enterpriseCard.locator('text=White-label branding')).toBeVisible()
      await expect(enterpriseCard.locator('text=Dedicated account manager')).toBeVisible()
      await expect(enterpriseCard.locator('text=Custom compliance rules')).toBeVisible()
    })

    test('should display firm-level target audience', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('text=Perfect for:')).toBeVisible()
      await expect(enterpriseCard.locator('text=Firms with 500+ clients, multiple advisors')).toBeVisible()
    })

    test('should display Contact Sales CTA', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('button:has-text("Contact Sales")')).toBeVisible()
    })

    test('should NOT display monthly total or cost per asset', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      const monthlyTotal = enterpriseCard.locator('text=Monthly Total:')
      const costPerAsset = enterpriseCard.locator('text=Cost per asset:')

      await expect(monthlyTotal).not.toBeVisible()
      await expect(costPerAsset).not.toBeVisible()
    })
  })

  test.describe('Section Header', () => {
    test('should display updated section title and subtitle', async ({ page }) => {
      const pricingSection = page.locator('#pricing')
      await expect(pricingSection.locator('h2:has-text("Choose Your Growth Plan")')).toBeVisible()
      await expect(pricingSection.locator('text=All plans include Grammy-level AI content (9.0+ virality) & SEBI compliance')).toBeVisible()
    })
  })

  test.describe('Visual Design Elements', () => {
    test('Solo plan should have yellow badge', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      const badge = soloCard.locator('span:has-text("For Individual Advisors")')

      const bgColor = await badge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })
      expect(bgColor).toContain('gradient')
    })

    test('Professional plan should have emerald/green badge', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      const badge = proCard.locator('span:has-text("⭐ MOST POPULAR")')

      const bgColor = await badge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })
      expect(bgColor).toContain('gradient')
    })

    test('all cards should have checkmarks (✅) for daily content', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      const checkmarks = soloCard.locator('text=✅')
      const count = await checkmarks.count()
      expect(count).toBeGreaterThan(0)
    })

    test('all cards should have black card backgrounds', async ({ page }) => {
      const allCards = page.locator('#pricing article')
      const count = await allCards.count()
      expect(count).toBe(3)

      // All cards should have dark backgrounds
      for (let i = 0; i < count; i++) {
        const card = allCards.nth(i)
        await expect(card).toBeVisible()
      }
    })
  })

  test.describe('Content Quantity Clarity', () => {
    test('Solo: clearly shows 1 asset per day = 30/month', async ({ page }) => {
      const soloCard = page.locator('article:has-text("Solo")').first()
      await expect(soloCard.locator('text=1 WhatsApp message/day')).toBeVisible()
      await expect(soloCard.locator('text=30 viral WhatsApp messages')).toBeVisible()
    })

    test('Professional: clearly shows 3 assets per day = 90/month', async ({ page }) => {
      const proCard = page.locator('article:has-text("Professional")').first()
      await expect(proCard.locator('text=1 LinkedIn post/day')).toBeVisible()
      await expect(proCard.locator('text=1 WhatsApp message/day')).toBeVisible()
      await expect(proCard.locator('text=1 WhatsApp Status image/day')).toBeVisible()
      await expect(proCard.locator('text=90 total assets (3 per day)')).toBeVisible()
    })

    test('Enterprise: clearly shows unlimited content', async ({ page }) => {
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()
      await expect(enterpriseCard.locator('text=Unlimited content generation')).toBeVisible()
    })
  })

  test.describe('Responsive Layout', () => {
    test('cards should stack on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const soloCard = page.locator('article:has-text("Solo")').first()
      const proCard = page.locator('article:has-text("Professional")').first()
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()

      await expect(soloCard).toBeVisible()
      await expect(proCard).toBeVisible()
      await expect(enterpriseCard).toBeVisible()
    })

    test('cards should be side by side on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })

      const soloCard = page.locator('article:has-text("Solo")').first()
      const proCard = page.locator('article:has-text("Professional")').first()
      const enterpriseCard = page.locator('article:has-text("Enterprise")').first()

      const soloBox = await soloCard.boundingBox()
      const proBox = await proCard.boundingBox()
      const enterpriseBox = await enterpriseCard.boundingBox()

      // All three should be visible in one row
      expect(soloBox.y).toBeLessThan(proBox.y + proBox.height)
      expect(proBox.y).toBeLessThan(enterpriseBox.y + enterpriseBox.height)
    })
  })
})
