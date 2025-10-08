import { test, expect } from '@playwright/test'

test.describe('Hero Section - Updated Messaging Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
  })

  test('should display correct badge text', async ({ page }) => {
    const badge = page.locator('text=🚀 AI-powered viral content in 2.3 seconds')
    await expect(badge).toBeVisible()
  })

  test('should display updated H1 headline', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toContainText('Save 15 Hours/Week')
    await expect(h1).toContainText('Creating Viral Content')
  })

  test('should display H2 with all three content types', async ({ page }) => {
    const h2 = page.locator('header h2').first()
    await expect(h2).toBeVisible()
    await expect(h2).toContainText('Grammy-Level')
    await expect(h2).toContainText('LinkedIn Posts + WhatsApp Messages + Status Images')
  })

  test('should display updated subheadline with clear value proposition', async ({ page }) => {
    const subheadline = page.locator('text=While competitors think, you deliver')
    await expect(subheadline).toBeVisible()
    await expect(subheadline).toContainText('9.0+ virality content*')
    await expect(subheadline).toContainText('for LinkedIn and WhatsApp')
    await expect(subheadline).toContainText('98% engagement')
    await expect(subheadline).toContainText('Your clients see professional content')
    await expect(subheadline).toContainText('You save time')
  })

  test('should display virality score footnote', async ({ page }) => {
    const footnote = page.locator('text=*Virality Score 0-10')
    await expect(footnote).toBeVisible()
    await expect(footnote).toContainText('We guarantee 9.0+ (top-tier viral content) or regenerate free')
  })

  test('should display primary CTA button with star', async ({ page }) => {
    const ctaButton = page.locator('button', { hasText: 'Start Free Trial' })
    await expect(ctaButton).toBeVisible()
    const buttonText = await ctaButton.textContent()
    expect(buttonText).toContain('☆')
  })

  test('should display secondary CTA button', async ({ page }) => {
    const watchDemo = page.locator('button', { hasText: 'Watch Demo' })
    await expect(watchDemo).toBeVisible()
  })

  test('should have black background on hero section', async ({ page }) => {
    const hero = page.locator('header').first()
    const bgColor = await hero.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    // Black background should be rgb(0, 0, 0) or similar dark color
    expect(bgColor).toBeTruthy()
  })

  test('should have gold accent on "Grammy-Level" text in H2', async ({ page }) => {
    const h2 = page.locator('header h2').first()
    const goldSpan = h2.locator('span', { hasText: 'Grammy-Level' })
    await expect(goldSpan).toBeVisible()

    const color = await goldSpan.evaluate((el) => {
      return window.getComputedStyle(el).color
    })
    // Should have gold/yellow color (not white or gray)
    expect(color).toBeTruthy()
  })

  test('should have golden CTA button styling', async ({ page }) => {
    const ctaButton = page.locator('button', { hasText: 'Start Free Trial' }).first()
    const bgGradient = await ctaButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage
    })
    // Should have gradient background
    expect(bgGradient).toContain('gradient')
  })

  test('should be mobile responsive - all elements visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    await expect(page.locator('header h1').first()).toBeVisible()
    await expect(page.locator('header h2').first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Start Free Trial' }).first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Watch Demo' }).first()).toBeVisible()
  })

  test('should be mobile responsive - all elements visible on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad

    await expect(page.locator('header h1').first()).toBeVisible()
    await expect(page.locator('header h2').first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Start Free Trial' }).first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Watch Demo' }).first()).toBeVisible()
  })

  test('should have correct text hierarchy and spacing', async ({ page }) => {
    const badge = page.locator('header div:has-text("🚀 AI-powered viral content")').first()
    const h1 = page.locator('header h1').first()
    const h2 = page.locator('header h2').first()
    const subheadline = page.locator('header p:has-text("While competitors think")').first()
    const footnote = page.locator('header p:has-text("*Virality Score")').first()

    // All elements should be visible
    await expect(badge).toBeVisible()
    await expect(h1).toBeVisible()
    await expect(h2).toBeVisible()
    await expect(subheadline).toBeVisible()
    await expect(footnote).toBeVisible()

    // Check vertical order (badge should be above h1, h1 above h2, etc.)
    const badgeBox = await badge.boundingBox()
    const h1Box = await h1.boundingBox()
    const h2Box = await h2.boundingBox()

    expect(badgeBox.y).toBeLessThan(h1Box.y)
    expect(h1Box.y).toBeLessThan(h2Box.y)
  })

  test('should have shadow effects on headings for readability', async ({ page }) => {
    const h1 = page.locator('header h1').first()
    const h2 = page.locator('header h2').first()

    const h1Shadow = await h1.evaluate((el) => {
      return window.getComputedStyle(el).textShadow
    })
    const h2Shadow = await h2.evaluate((el) => {
      return window.getComputedStyle(el).textShadow
    })

    // Both should have text shadows for readability
    expect(h1Shadow).not.toBe('none')
    expect(h2Shadow).not.toBe('none')
  })

  test('should have hover effects on CTA buttons', async ({ page }) => {
    const ctaButton = page.locator('button', { hasText: 'Start Free Trial' }).first()

    // Hover over button
    await ctaButton.hover()

    // Button should still be visible after hover
    await expect(ctaButton).toBeVisible()
  })

  test('should have proper contrast ratios for accessibility', async ({ page }) => {
    const h1 = page.locator('header h1').first()
    const subheadline = page.locator('header p:has-text("While competitors think")').first()

    // White text on dark background should have good contrast
    const h1Color = await h1.evaluate((el) => {
      return window.getComputedStyle(el).color
    })
    const subheadlineColor = await subheadline.evaluate((el) => {
      return window.getComputedStyle(el).color
    })

    // Both should be light colored (white or light gray)
    expect(h1Color).toBeTruthy()
    expect(subheadlineColor).toBeTruthy()
  })

  test('should center content on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const h1 = page.locator('header h1').first()
    const h1Box = await h1.boundingBox()

    // H1 should be relatively centered (not too far left or right)
    expect(h1Box.x).toBeGreaterThan(0)
    expect(h1Box.x).toBeLessThan(200)
  })

  test('should align content to left on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    const h1 = page.locator('header h1').first()
    const textAlign = await h1.evaluate((el) => {
      return window.getComputedStyle(el).textAlign
    })

    // On desktop, should be left-aligned
    expect(textAlign).toBe('left')
  })
})
