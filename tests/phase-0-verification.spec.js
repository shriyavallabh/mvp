import { test, expect } from '@playwright/test';

/**
 * Phase 0 Verification Tests
 * Tests all 6 landing page improvements from Prompts 0.1-0.6
 */

test.describe('Phase 0: Landing Page Clarity Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3005');
    await page.waitForLoadState('networkidle');
  });

  test('0.1: Hero section mentions both LinkedIn and WhatsApp', async ({ page }) => {
    // Check hero heading mentions both platforms
    const heroSection = page.locator('header').first();

    // Should mention LinkedIn
    await expect(heroSection.getByText(/LinkedIn/i)).toBeVisible();

    // Should mention WhatsApp
    await expect(heroSection.getByText(/WhatsApp/i)).toBeVisible();

    // Should show virality score guarantee
    await expect(heroSection.getByText(/9\.0\+/i)).toBeVisible();

    // Should mention "Grammy-Level"
    await expect(heroSection.getByText(/Grammy-Level/i)).toBeVisible();

    console.log('✅ 0.1: Hero section verified');
  });

  test('0.2: Pricing cards show exact content quantities', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Solo plan: Should show "1 WhatsApp message/day"
    const soloPlan = page.getByRole('listitem', { name: /solo plan/i });
    await expect(soloPlan.getByText(/1 WhatsApp message\/day/i)).toBeVisible();

    // Professional plan: Should show all 3 asset types
    const professionalPlan = page.getByRole('listitem', { name: /professional plan/i });
    await expect(professionalPlan.getByText(/1 LinkedIn post\/day/i)).toBeVisible();
    await expect(professionalPlan.getByText(/1 WhatsApp message\/day/i)).toBeVisible();
    await expect(professionalPlan.getByText(/1 WhatsApp Status image\/day/i)).toBeVisible();

    // Should show "90 total assets (3 per day)"
    await expect(professionalPlan.getByText(/90 total assets/i)).toBeVisible();
    await expect(professionalPlan.getByText(/3 per day/i)).toBeVisible();

    // Enterprise plan: Should show "Unlimited"
    const enterprisePlan = page.getByRole('listitem', { name: /enterprise plan/i });
    await expect(enterprisePlan.getByText(/Unlimited/i)).toBeVisible();

    console.log('✅ 0.2: Pricing quantities verified');
  });

  test('0.3: "What You Get Daily" section exists with 3 asset types', async ({ page }) => {
    // Find the section
    const dailySection = page.getByRole('heading', { name: /What You Get Every Morning/i });
    await dailySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Should show "6 AM"
    await expect(page.getByText(/6 AM/i)).toBeVisible();

    // Should show LinkedIn Post card
    await expect(page.getByRole('heading', { name: /LinkedIn Post/i })).toBeVisible();

    // Should show WhatsApp Message card
    await expect(page.getByRole('heading', { name: /WhatsApp Message/i })).toBeVisible();

    // Should show WhatsApp Status Image card
    await expect(page.getByRole('heading', { name: /WhatsApp Status Image/i })).toBeVisible();

    console.log('✅ 0.3: Daily content showcase verified');
  });

  test('0.4: Example Content section with working tabs', async ({ page }) => {
    // Scroll to Example Content section
    const exampleSection = page.getByRole('heading', { name: /See.*Grammy-Level Content.*in Action/i });
    await exampleSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check tabs exist
    const linkedInTab = page.getByRole('tab', { name: /LinkedIn Posts/i });
    const whatsAppTab = page.getByRole('tab', { name: /WhatsApp Messages/i });
    const statusTab = page.getByRole('tab', { name: /Status Images/i });

    await expect(linkedInTab).toBeVisible();
    await expect(whatsAppTab).toBeVisible();
    await expect(statusTab).toBeVisible();

    // Test tab switching - LinkedIn should be default
    await expect(linkedInTab).toHaveAttribute('data-state', 'active');

    // LinkedIn tab content should show engagement stats
    await expect(page.getByText(/342 likes/i)).toBeVisible();
    await expect(page.getByText(/9\.2\/10 Virality/i)).toBeVisible();

    // Click WhatsApp tab
    await whatsAppTab.click();
    await page.waitForTimeout(300);
    await expect(whatsAppTab).toHaveAttribute('data-state', 'active');

    // WhatsApp content should show stats
    await expect(page.getByText(/87% open rate/i)).toBeVisible();

    // Click Status tab
    await statusTab.click();
    await page.waitForTimeout(300);
    await expect(statusTab).toHaveAttribute('data-state', 'active');

    // Status content should show view counts
    await expect(page.getByText(/1,245 views/i).or(page.getByText(/892 views/i))).toBeVisible();

    // CTA should exist
    await expect(page.getByRole('button', { name: /Start 14-Day Free Trial/i }).last()).toBeVisible();

    console.log('✅ 0.4: Example content tabs verified');
  });

  test('0.5: Trial clarity badges on all pricing cards', async ({ page }) => {
    // Scroll to pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Solo plan should have green trial badge
    const soloPlan = page.getByRole('listitem', { name: /solo plan/i });
    await expect(soloPlan.getByText(/14-Day Free Trial/i)).toBeVisible();
    await expect(soloPlan.getByText(/No Credit Card Required/i)).toBeVisible();
    await expect(soloPlan.getByText(/Cancel Anytime/i)).toBeVisible();

    // Professional plan should have green trial badge
    const professionalPlan = page.getByRole('listitem', { name: /professional plan/i });
    await expect(professionalPlan.getByText(/14-Day Free Trial/i)).toBeVisible();
    await expect(professionalPlan.getByText(/No Credit Card Required/i)).toBeVisible();
    await expect(professionalPlan.getByText(/Cancel Anytime/i)).toBeVisible();

    // Both should have disclaimer text
    await expect(soloPlan.getByText(/Full access to all features/i)).toBeVisible();
    await expect(professionalPlan.getByText(/Full access to all features/i)).toBeVisible();

    // Enterprise should have gold consultation badge
    const enterprisePlan = page.getByRole('listitem', { name: /enterprise plan/i });
    await expect(enterprisePlan.getByText(/Free Consultation/i)).toBeVisible();
    await expect(enterprisePlan.getByText(/Custom Pricing/i)).toBeVisible();
    await expect(enterprisePlan.getByText(/Flexible Contract/i)).toBeVisible();

    console.log('✅ 0.5: Trial clarity badges verified');
  });

  test('0.6: ROI Calculator exists and works correctly', async ({ page }) => {
    // Scroll to ROI Calculator
    const roiSection = page.getByRole('heading', { name: /How Much Does Content Creation Cost You Today/i });
    await roiSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check section exists
    await expect(roiSection).toBeVisible();

    // Check form fields exist
    await expect(page.getByPlaceholder('0').first()).toBeVisible();

    // Test "Use This Example" button
    const exampleButton = page.getByRole('button', { name: /Use This Example/i });
    await expect(exampleButton).toBeVisible();
    await exampleButton.click();
    await page.waitForTimeout(500);

    // After clicking, calculator should show savings
    await expect(page.getByText(/₹42,501/i)).toBeVisible();
    await expect(page.getByText(/90% cost reduction/i)).toBeVisible();

    // Test manual input - clear and enter new values
    const writerInput = page.locator('input[type="number"]').first();
    await writerInput.click();
    await writerInput.fill('');
    await writerInput.fill('20000');
    await page.waitForTimeout(300);

    // Calculator should update (total should change)
    // Since we changed writer cost from 15000 to 20000, total should increase by 5000
    // New total: 47000 + 5000 = 52000, savings = 52000 - 4499 = 47501
    await expect(page.getByText(/₹47,501/i).or(page.getByText(/47,501/i))).toBeVisible();

    // Bottom CTA should exist
    await expect(page.getByRole('link', { name: /Start Saving Today/i })).toBeVisible();

    console.log('✅ 0.6: ROI Calculator verified');
  });

  test('0.7: All sections load without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Scroll through entire page
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 4));
    await page.waitForTimeout(500);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 3 / 4));
    await page.waitForTimeout(500);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check no critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('manifest')
    );

    expect(criticalErrors.length).toBe(0);

    console.log('✅ 0.7: Page loads without errors');
  });

  test('0.8: Take full page screenshot for verification', async ({ page }) => {
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Take screenshots of each section
    await page.screenshot({
      path: 'tests/screenshots/phase-0-hero.png',
      fullPage: false
    });

    // Daily showcase
    const dailySection = page.getByRole('heading', { name: /What You Get Every Morning/i });
    await dailySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/phase-0-daily-showcase.png',
      fullPage: false
    });

    // Example content
    const exampleSection = page.getByRole('heading', { name: /Grammy-Level Content/i });
    await exampleSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/phase-0-example-content.png',
      fullPage: false
    });

    // ROI Calculator
    const roiSection = page.getByRole('heading', { name: /How Much Does Content Creation Cost/i });
    await roiSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/phase-0-roi-calculator.png',
      fullPage: false
    });

    // Pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/phase-0-pricing.png',
      fullPage: false
    });

    // Full page
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/screenshots/phase-0-full-page.png',
      fullPage: true
    });

    console.log('✅ 0.8: Screenshots captured');
  });
});
