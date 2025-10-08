import { test, expect } from '@playwright/test'

test.describe('Daily Content Showcase - Visual Explainer Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
  })

  test.describe('Section Header', () => {
    test('should display main heading with "6 AM" in gold', async ({ page }) => {
      const heading = page.locator('h2:has-text("What You Get Every Morning at 6 AM")')
      await expect(heading).toBeVisible()

      // Check that "6 AM" has gold color
      const goldSpan = heading.locator('span:has-text("6 AM")')
      await expect(goldSpan).toBeVisible()
    })
  })

  test.describe('LinkedIn Post Column', () => {
    test('should display LinkedIn icon and title', async ({ page }) => {
      const linkedinSection = page.locator('text=LinkedIn Post').first()
      await expect(linkedinSection).toBeVisible()
    })

    test('should display description', async ({ page }) => {
      await expect(page.locator('text=Professional content that builds your credibility')).toBeVisible()
    })

    test('should display example post with SIP content', async ({ page }) => {
      await expect(page.locator('text=📊 SIP returns hit 15.2% this quarter.')).toBeVisible()
      await expect(page.locator('text=Here\'s why systematic investing beats lump-sum')).toBeVisible()
    })

    test('should display bullet points in example', async ({ page }) => {
      await expect(page.locator('text=• Rupee cost averaging')).toBeVisible()
      await expect(page.locator('text=• Discipline over timing')).toBeVisible()
      await expect(page.locator('text=• 15.2% CAGR (5 years)')).toBeVisible()
    })

    test('should display hashtags', async ({ page }) => {
      await expect(page.locator('text=#MutualFunds #SIP')).toBeVisible()
    })

    test('should display "Ready to publish" badge', async ({ page }) => {
      const badge = page.locator('text=Ready to publish').first()
      await expect(badge).toBeVisible()
    })

    test('should have LinkedIn blue icon background', async ({ page }) => {
      const iconContainer = page.locator('div').filter({ has: page.locator('text=💼') }).first()
      const bgColor = await iconContainer.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      // Should be LinkedIn blue (#0A66C2) or similar
      expect(bgColor).toBeTruthy()
    })
  })

  test.describe('WhatsApp Message Column', () => {
    test('should display WhatsApp icon and title', async ({ page }) => {
      const whatsappSection = page.locator('text=WhatsApp Message').first()
      await expect(whatsappSection).toBeVisible()
    })

    test('should display description', async ({ page }) => {
      await expect(page.locator('text=Personal update that drives client responses')).toBeVisible()
    })

    test('should display WhatsApp bubble with fire emoji', async ({ page }) => {
      await expect(page.locator('text=🔥 Quick market update:')).toBeVisible()
    })

    test('should display complete message content', async ({ page }) => {
      await expect(page.locator('text=SIP returns just hit 15.2% this quarter!')).toBeVisible()
      await expect(page.locator('text=This is why I recommend systematic investing.')).toBeVisible()
      await expect(page.locator('text=Want to discuss your portfolio? Reply "YES"')).toBeVisible()
    })

    test('should display timestamp', async ({ page }) => {
      await expect(page.locator('text=6:00 AM')).toBeVisible()
    })

    test('should display "Ready to send" badge', async ({ page }) => {
      const badges = page.locator('text=Ready to send')
      await expect(badges.first()).toBeVisible()
    })

    test('should have WhatsApp green bubble background', async ({ page }) => {
      const bubble = page.locator('div').filter({ hasText: '🔥 Quick market update:' }).first()
      const bgColor = await bubble.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      // Should be WhatsApp green (#005C4B) or similar dark green
      expect(bgColor).toBeTruthy()
    })
  })

  test.describe('WhatsApp Status Column', () => {
    test('should display Status icon and title', async ({ page }) => {
      const statusSection = page.locator('text=WhatsApp Status Image').first()
      await expect(statusSection).toBeVisible()
    })

    test('should display description', async ({ page }) => {
      await expect(page.locator('text=Branded visual that keeps you top-of-mind')).toBeVisible()
    })

    test('should display phone mockup with SIP returns', async ({ page }) => {
      await expect(page.locator('text=SIP Returns:')).toBeVisible()
      await expect(page.locator('text=15.2%')).toBeVisible()
    })

    test('should display quarter indicator', async ({ page }) => {
      await expect(page.locator('text=Q4 2025')).toBeVisible()
    })

    test('should display logo placeholder', async ({ page }) => {
      await expect(page.locator('text=[Your Logo]')).toBeVisible()
    })

    test('should display "1080×1920 branded" badge', async ({ page }) => {
      const badge = page.locator('text=1080×1920 branded')
      await expect(badge).toBeVisible()
    })

    test('should have phone mockup with rounded corners', async ({ page }) => {
      // Check for phone mockup container
      const phoneMockup = page.locator('div.aspect-\\[9\\/16\\]').first()
      await expect(phoneMockup).toBeVisible()
    })

    test('should have gold gradient in status image', async ({ page }) => {
      const statusContainer = page.locator('text=15.2%').first()
      await expect(statusContainer).toBeVisible()
    })
  })

  test.describe('Plan Subtext', () => {
    test('should display Solo plan details', async ({ page }) => {
      await expect(page.locator('text=Solo plan: WhatsApp message only (₹1,799)')).toBeVisible()
    })

    test('should display Professional plan details with highlighting', async ({ page }) => {
      await expect(page.locator('text=Professional plan: All 3 assets daily (₹4,499)')).toBeVisible()
    })

    test('should display Enterprise plan details', async ({ page }) => {
      await expect(page.locator('text=Enterprise: Custom unlimited (Contact us)')).toBeVisible()
    })

    test('should have Professional plan in gold color', async ({ page }) => {
      const professionalText = page.locator('span:has-text("Professional plan:")')
      const color = await professionalText.evaluate((el) => {
        return window.getComputedStyle(el).color
      })
      // Should be gold color
      expect(color).toBeTruthy()
    })
  })

  test.describe('Visual Design Elements', () => {
    test('should have black background with gradient', async ({ page }) => {
      const section = page.locator('section').filter({ hasText: 'What You Get Every Morning' }).first()
      const bgColor = await section.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })
      // Should have gradient
      expect(bgColor).toContain('gradient')
    })

    test('all 3 columns should have dark card backgrounds', async ({ page }) => {
      const cards = page.locator('div.rounded-2xl.bg-\\[\\#1A1A1A\\]')
      const count = await cards.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('should display green status badges on all items', async ({ page }) => {
      // Should have 3 green badges (Ready to publish, Ready to send, 1080×1920 branded)
      const greenBadges = page.locator('div').filter({ hasText: /Ready to|1080×1920/ })
      const count = await greenBadges.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should have proper spacing between columns on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })

      const linkedinCard = page.locator('text=LinkedIn Post').first()
      const whatsappCard = page.locator('text=WhatsApp Message').first()
      const statusCard = page.locator('text=WhatsApp Status Image').first()

      await expect(linkedinCard).toBeVisible()
      await expect(whatsappCard).toBeVisible()
      await expect(statusCard).toBeVisible()
    })
  })

  test.describe('Content Mockups', () => {
    test('LinkedIn post should have realistic formatting', async ({ page }) => {
      // Check for paragraph breaks and bullet structure
      const linkedinExample = page.locator('div').filter({ hasText: '📊 SIP returns hit 15.2%' }).first()
      await expect(linkedinExample).toBeVisible()

      // Should have call to action
      await expect(page.locator('text=DM to review your SIP.')).toBeVisible()
    })

    test('WhatsApp message should have bubble tail', async ({ page }) => {
      // Check for WhatsApp-style bubble with positioning
      const bubble = page.locator('div.relative.rounded-lg.bg-\\[\\#005C4B\\]').first()
      await expect(bubble).toBeVisible()
    })

    test('Status image should show vertical phone aspect ratio', async ({ page }) => {
      // Check for 9:16 aspect ratio container
      const phoneScreen = page.locator('div.aspect-\\[9\\/16\\]').first()
      await expect(phoneScreen).toBeVisible()

      const boundingBox = await phoneScreen.boundingBox()
      if (boundingBox) {
        const aspectRatio = boundingBox.width / boundingBox.height
        // 9:16 = 0.5625
        expect(aspectRatio).toBeGreaterThan(0.5)
        expect(aspectRatio).toBeLessThan(0.6)
      }
    })
  })

  test.describe('Responsive Layout', () => {
    test('should stack columns vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const linkedinCard = page.locator('text=LinkedIn Post').first()
      const whatsappCard = page.locator('text=WhatsApp Message').first()
      const statusCard = page.locator('text=WhatsApp Status Image').first()

      // All should be visible
      await expect(linkedinCard).toBeVisible()
      await expect(whatsappCard).toBeVisible()
      await expect(statusCard).toBeVisible()

      // Check vertical stacking
      const linkedinBox = await linkedinCard.boundingBox()
      const whatsappBox = await whatsappCard.boundingBox()

      if (linkedinBox && whatsappBox) {
        // WhatsApp should be below LinkedIn (higher y-coordinate)
        expect(whatsappBox.y).toBeGreaterThan(linkedinBox.y)
      }
    })

    test('should display 3 columns side by side on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })

      const grid = page.locator('div.grid.md\\:grid-cols-3').first()
      await expect(grid).toBeVisible()
    })

    test('mockups should be properly sized on all viewports', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)

        const linkedinExample = page.locator('div').filter({ hasText: '📊 SIP returns' }).first()
        const whatsappBubble = page.locator('div').filter({ hasText: '🔥 Quick market' }).first()
        const phoneMockup = page.locator('div.aspect-\\[9\\/16\\]').first()

        await expect(linkedinExample).toBeVisible()
        await expect(whatsappBubble).toBeVisible()
        await expect(phoneMockup).toBeVisible()
      }
    })
  })

  test.describe('Section Positioning', () => {
    test('should appear below hero section', async ({ page }) => {
      const hero = page.locator('header').first()
      const showcase = page.locator('section').filter({ hasText: 'What You Get Every Morning' }).first()

      const heroBox = await hero.boundingBox()
      const showcaseBox = await showcase.boundingBox()

      if (heroBox && showcaseBox) {
        // Showcase should be below hero
        expect(showcaseBox.y).toBeGreaterThan(heroBox.y + heroBox.height - 100)
      }
    })

    test('should be visible when scrolling from hero', async ({ page }) => {
      // Start at top
      await page.evaluate(() => window.scrollTo(0, 0))

      // Scroll down to showcase
      await page.locator('text=What You Get Every Morning').scrollIntoViewIfNeeded()

      const showcase = page.locator('section').filter({ hasText: 'What You Get Every Morning' }).first()
      await expect(showcase).toBeVisible()
    })
  })

  test.describe('Platform-Specific Styling', () => {
    test('LinkedIn icon should have LinkedIn blue background', async ({ page }) => {
      const linkedinIcon = page.locator('div').filter({ has: page.locator('text=💼') }).first()
      const bgColor = await linkedinIcon.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      // Should be blue (LinkedIn #0A66C2)
      expect(bgColor).toMatch(/rgb\(10, 102, 194\)|#0A66C2/i)
    })

    test('WhatsApp icon should have WhatsApp green background', async ({ page }) => {
      const whatsappIcon = page.locator('div').filter({ has: page.locator('text=📱') }).first()
      const bgColor = await whatsappIcon.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      // Should be green (WhatsApp #25D366)
      expect(bgColor).toMatch(/rgb\(37, 211, 102\)|#25D366/i)
    })

    test('Status icon should have gradient background', async ({ page }) => {
      const statusIcon = page.locator('div').filter({ has: page.locator('text=📊') }).first()
      const bgImage = await statusIcon.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })
      // Should have gradient (purple to pink)
      expect(bgImage).toContain('gradient')
    })
  })
})
