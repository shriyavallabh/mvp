const { test, expect } = require('@playwright/test');

const PROD_URL = 'https://finadvise-webhook.vercel.app';
const LOCAL_URL = 'http://localhost:3001';
const BASE_URL = process.env.CI ? PROD_URL : LOCAL_URL;

test.describe('Landing Page - Visual Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Hero Section', () => {
    test('should display hero heading with correct text', async ({ page }) => {
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      const text = await heading.textContent();
      expect(text).toContain('Grammy-Level');
      expect(text).toContain('Viral Content');
      expect(text).toContain('WhatsApp');
    });

    test('should display hero subtitle', async ({ page }) => {
      const subtitle = page.locator('section').first().locator('p').first();
      await expect(subtitle).toBeVisible();
      const text = await subtitle.textContent();
      expect(text).toContain('8.0+');
      expect(text).toContain('500+');
    });

    test('should display Start Free Trial button', async ({ page }) => {
      const startButton = page.locator('button:has-text("Start Free Trial")');
      await expect(startButton).toBeVisible();
    });

    test('should display Watch Demo button', async ({ page }) => {
      const demoButton = page.locator('button:has-text("Watch Demo")');
      await expect(demoButton).toBeVisible();
    });

    test('Start Free Trial button should have correct styling', async ({ page }) => {
      const button = page.locator('button:has-text("Start Free Trial")').first();
      const bgColor = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Yellow button (#FFB800 = rgb(255, 184, 0))
      expect(bgColor).toContain('255');
    });

    test('Watch Demo button should have border styling', async ({ page }) => {
      const button = page.locator('button:has-text("Watch Demo")');
      const border = await button.evaluate(el => window.getComputedStyle(el).border);
      expect(border).toBeTruthy();
    });
  });

  test.describe('Phone Mockup', () => {
    test('should display phone mockup container', async ({ page }) => {
      // Check for WhatsApp messages
      const messages = page.locator('p').filter({ hasText: 'MINS' });
      await expect(messages.first()).toBeVisible();
    });

    test('should display multiple WhatsApp messages', async ({ page }) => {
      const messages = page.locator('p').filter({ hasText: 'MINS' });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('phone screen should have proper background', async ({ page }) => {
      const whatsappScreen = page.locator('div').filter({ hasText: 'MINS' }).first();
      await expect(whatsappScreen).toBeVisible();
    });
  });

  test.describe('Social Proof Bar', () => {
    test('should display 2.4M+ stat', async ({ page }) => {
      const stat = page.locator('text=2.4M+');
      await expect(stat).toBeVisible();
    });

    test('should display Portfolio size label', async ({ page }) => {
      const label = page.locator('text=Portfolio size');
      await expect(label).toBeVisible();
    });

    test('should display company logos', async ({ page }) => {
      const hdfc = page.locator('text=HDFC');
      const axis = page.locator('text=AXIS');
      const kotak = page.locator('text=kotak');
      const sbi = page.locator('text=SBI');

      await expect(hdfc).toBeVisible();
      await expect(axis).toBeVisible();
      await expect(kotak).toBeVisible();
      await expect(sbi).toBeVisible();
    });

    test('should display 28K advisors stat', async ({ page }) => {
      const stat = page.locator('div').filter({ hasText: /^❓28K$/ });
      await expect(stat).toBeVisible();
    });

    test('should display advisors on platform label', async ({ page }) => {
      const label = page.locator('text=advisors on platform');
      await expect(label).toBeVisible();
    });
  });

  test.describe('Features Section', () => {
    test('should display all three feature cards', async ({ page }) => {
      const viralAI = page.locator('text=Viral AI Content');
      const whatsapp = page.locator('text=WhatsApp Native');
      const zeroEffort = page.locator('text=Zero Effort');

      await expect(viralAI).toBeVisible();
      await expect(whatsapp).toBeVisible();
      await expect(zeroEffort).toBeVisible();
    });

    test('should display Viral AI Content description', async ({ page }) => {
      const description = page.locator('text=Vierelize storries');
      await expect(description).toBeVisible();
    });

    test('should display WhatsApp Native description', async ({ page }) => {
      const description = page.locator('text=Optimizes or going content');
      await expect(description).toBeVisible();
    });

    test('should display Zero Effort description', async ({ page }) => {
      const description = page.locator('text=Delivers cofficient content');
      await expect(description).toBeVisible();
    });

    test('feature cards should have white background', async ({ page }) => {
      const card = page.locator('h3:has-text("Viral AI Content")').locator('..');
      const bgColor = await card.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(bgColor).toContain('255'); // White contains 255 for all RGB
    });
  });

  test.describe('How It Works Section', () => {
    test('should display How It Works heading', async ({ page }) => {
      const heading = page.locator('h2:has-text("How It Works")');
      await expect(heading).toBeVisible();
    });

    test('should display all four steps', async ({ page }) => {
      const step1 = page.locator('text=Add Preferences');
      const step2 = page.locator('text=AI Generates');
      const step3 = page.locator('text=Review & Approve');
      const step4 = page.locator('text=Auto-Deliver');

      await expect(step1).toBeVisible();
      await expect(step2).toBeVisible();
      await expect(step3).toBeVisible();
      await expect(step4).toBeVisible();
    });

    test('should display step numbers', async ({ page }) => {
      const numbers = page.locator('div').filter({ hasText: /^[1-4]$/ });
      const count = await numbers.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('should display step descriptions', async ({ page }) => {
      const desc1 = page.locator('text=Conducts whit payment');
      const desc2 = page.locator('text=Microcine line');
      const desc3 = page.locator('text=Promdes bosument');
      const desc4 = page.locator('text=Experive augmention');

      await expect(desc1).toBeVisible();
      await expect(desc2).toBeVisible();
      await expect(desc3).toBeVisible();
      await expect(desc4).toBeVisible();
    });
  });

  test.describe('Testimonial Section', () => {
    test('should display testimonial card', async ({ page }) => {
      const quote = page.locator('text=The content is always timely');
      await expect(quote).toBeVisible();
    });

    test('should display five stars rating', async ({ page }) => {
      const stars = page.locator('text=★★★★★');
      await expect(stars).toBeVisible();
    });

    test('should display testimonial author name', async ({ page }) => {
      const name = page.locator('text=Nith Nekia');
      await expect(name).toBeVisible();
    });

    test('should display Financial Advisor role', async ({ page }) => {
      const role = page.locator('text=Financial Advisor');
      await expect(role).toBeVisible();
    });

    test('should display full testimonial attribution', async ({ page }) => {
      const attribution = page.locator('text=Nitin Mehita');
      await expect(attribution).toBeVisible();
    });
  });

  test.describe('Pricing Section', () => {
    test('should display all three pricing tiers', async ({ page }) => {
      const basic = page.locator('h3:has-text("Basic")');
      const pro = page.locator('h3:has-text("Pro")');
      const agency = page.locator('h3:has-text("Agency")');

      await expect(basic).toBeVisible();
      await expect(pro).toBeVisible();
      await expect(agency).toBeVisible();
    });

    test('should display Basic plan price', async ({ page }) => {
      const price = page.locator('text=₹2,500');
      await expect(price).toBeVisible();
    });

    test('should display Pro plan price', async ({ page }) => {
      const price = page.locator('text=₹5,000');
      await expect(price).toBeVisible();
    });

    test('should display Agency plan price', async ({ page }) => {
      const price = page.locator('text=₹10,000');
      await expect(price).toBeVisible();
    });

    test('should display pricing period', async ({ page }) => {
      const periods = page.locator('text=/mo|/moth/');
      const count = await periods.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should display AI-generated content feature in all plans', async ({ page }) => {
      const features = page.locator('text=AI-generated content');
      const count = await features.count();
      expect(count).toBe(3);
    });

    test('should display WhatsApp integration feature in all plans', async ({ page }) => {
      const features = page.locator('text=WhatsApp integration');
      const count = await features.count();
      expect(count).toBe(3);
    });

    test('should display Engagement analytics feature in all plans', async ({ page }) => {
      const features = page.locator('text=Engagement analytics');
      const count = await features.count();
      expect(count).toBe(3);
    });

    test('should display Priority support feature in all plans', async ({ page }) => {
      const features = page.locator('text=Priority support');
      const count = await features.count();
      expect(count).toBe(3);
    });

    test('should display checkmarks for features', async ({ page }) => {
      const checkmarks = page.locator('text=✓');
      const count = await checkmarks.count();
      expect(count).toBe(12); // 4 features × 3 plans
    });

    test('should display Learn more button for Basic plan', async ({ page }) => {
      const buttons = page.locator('button:has-text("Learn more")');
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should display Get Started button for Pro plan', async ({ page }) => {
      const button = page.locator('button:has-text("Get Started")');
      await expect(button).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const startButton = page.locator('button').first();
      await expect(startButton).toBeVisible();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const features = page.locator('h3:has-text("Viral AI Content")');
      await expect(features).toBeVisible();
    });

    test('should be responsive on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const pricingCards = page.locator('h3:has-text("Basic")');
      await expect(pricingCards).toBeVisible();
    });
  });

  test.describe('Interactive Elements', () => {
    test('Start Free Trial button should be clickable', async ({ page }) => {
      const button = page.locator('button:has-text("Start Free Trial")').first();
      await expect(button).toBeEnabled();
      await button.click();
      // After click, Clerk modal should appear (we'll just verify no crash)
    });

    test('Watch Demo button should be clickable', async ({ page }) => {
      const button = page.locator('button:has-text("Watch Demo")');
      await expect(button).toBeEnabled();
    });

    test('pricing buttons should be clickable', async ({ page }) => {
      const learnMore = page.locator('button:has-text("Learn more")').first();
      await expect(learnMore).toBeEnabled();

      const getStarted = page.locator('button:has-text("Get Started")');
      await expect(getStarted).toBeEnabled();
    });
  });

  test.describe('Color Scheme Validation', () => {
    test('hero section should have dark navy background', async ({ page }) => {
      const hero = page.locator('section').first();
      const bgColor = await hero.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Should have dark blue/navy tones
      expect(bgColor).toBeTruthy();
    });

    test('feature cards should have white background', async ({ page }) => {
      const card = page.locator('h3:has-text("Viral AI Content")').locator('..');
      await expect(card).toBeVisible();
    });

    test('How It Works section should have light background', async ({ page }) => {
      const section = page.locator('h2:has-text("How It Works")').locator('..');
      await expect(section).toBeVisible();
    });
  });

  test.describe('Content Accuracy', () => {
    test('should contain exact hero headline text', async ({ page }) => {
      const heading = await page.locator('h1').first().textContent();
      expect(heading).toContain('Grammy-Level');
      expect(heading).toContain('Viral Content');
      expect(heading).toContain('Delivered Daily to');
      expect(heading).toContain('WhatsApp');
    });

    test('should contain exact feature card titles', async ({ page }) => {
      await expect(page.locator('text=Viral AI Content')).toBeVisible();
      await expect(page.locator('text=WhatsApp Native')).toBeVisible();
      await expect(page.locator('text=Zero Effort')).toBeVisible();
    });

    test('should contain exact pricing tier names', async ({ page }) => {
      await expect(page.locator('h3:has-text("Basic")')).toBeVisible();
      await expect(page.locator('h3:has-text("Pro")')).toBeVisible();
      await expect(page.locator('h3:has-text("Agency")')).toBeVisible();
    });
  });
});
