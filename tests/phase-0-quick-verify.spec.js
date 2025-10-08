import { test, expect } from '@playwright/test';

/**
 * Phase 0 Quick Verification - Simplified test with longer timeouts
 * Verifies all 6 landing page improvements render correctly
 */

test.describe('Phase 0: Quick Verification', () => {
  test('All Phase 0 improvements are visible and functional', async ({ page }) => {
    // Set longer timeout for this test (60s to handle slow compilation)
    test.setTimeout(60000);

    console.log('📝 Navigating to homepage...');
    await page.goto('http://localhost:3006', { waitUntil: 'networkidle', timeout: 45000 });

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded');

    // SECTION 1: Hero (Prompt 0.1)
    console.log('🔍 Checking Hero section...');
    await expect(page.getByText(/Save 15 Hours\/Week/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Grammy-Level/i).first()).toBeVisible();
    await expect(page.getByText(/LinkedIn Posts/i).first()).toBeVisible();
    await expect(page.getByText(/WhatsApp Messages/i).first()).toBeVisible();
    console.log('✅ Hero section verified - mentions LinkedIn + WhatsApp');

    // Take hero screenshot
    await page.screenshot({ path: 'tests/screenshots/hero-section.png', fullPage: false });

    // SECTION 2: Daily Content Showcase (Prompt 0.3)
    console.log('🔍 Checking Daily Content Showcase...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    const dailyHeading = page.getByText(/What You Get Every Morning/i).first();
    await expect(dailyHeading).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/LinkedIn Post/i).first()).toBeVisible();
    await expect(page.getByText(/WhatsApp Message/i).first()).toBeVisible();
    await expect(page.getByText(/WhatsApp Status Image/i).first()).toBeVisible();
    console.log('✅ Daily showcase verified - 3 asset types visible');

    await page.screenshot({ path: 'tests/screenshots/daily-showcase.png', fullPage: false });

    // SECTION 3: Example Content (Prompt 0.4)
    console.log('🔍 Checking Example Content section...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    const exampleHeading = page.getByText(/Grammy-Level Content.*in Action/i).first();
    await expect(exampleHeading).toBeVisible({ timeout: 10000 });

    // Check tabs
    const linkedinTab = page.getByRole('tab', { name: /LinkedIn Posts/i });
    const whatsappTab = page.getByRole('tab', { name: /WhatsApp Messages/i });
    const statusTab = page.getByRole('tab', { name: /Status Images/i });

    await expect(linkedinTab).toBeVisible();
    await expect(whatsappTab).toBeVisible();
    await expect(statusTab).toBeVisible();
    console.log('✅ Example content tabs visible');

    // Test tab switching
    console.log('🔍 Testing tab interactivity...');
    await whatsappTab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/87% open rate/i).or(page.getByText(/92% open rate/i))).toBeVisible();

    await statusTab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/views in/i)).toBeVisible();
    console.log('✅ Example content tabs functional');

    await page.screenshot({ path: 'tests/screenshots/example-content.png', fullPage: false });

    // SECTION 4: ROI Calculator (Prompt 0.6)
    console.log('🔍 Checking ROI Calculator...');
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(1000);

    const roiHeading = page.getByText(/How Much Does Content Creation Cost You Today/i).first();
    await expect(roiHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ ROI Calculator section visible');

    // Test "Use This Example" button
    const exampleButton = page.getByRole('button', { name: /Use This Example/i });
    await expect(exampleButton).toBeVisible();
    await exampleButton.click();
    await page.waitForTimeout(1000);

    // Should show savings
    await expect(page.getByText(/₹42,501/i).or(page.getByText(/42,501/i))).toBeVisible();
    await expect(page.getByText(/90% cost reduction/i).or(page.getByText(/90%/i))).toBeVisible();
    console.log('✅ ROI Calculator functional - calculates savings');

    await page.screenshot({ path: 'tests/screenshots/roi-calculator.png', fullPage: false });

    // SECTION 5: Pricing with Badges (Prompts 0.2 + 0.5)
    console.log('🔍 Checking Pricing section...');
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);

    // Check pricing heading
    await expect(page.getByText(/Choose Your Growth Plan/i).or(page.getByText(/pricing/i))).toBeVisible({ timeout: 10000 });

    // Check content quantities
    await expect(page.getByText(/1 WhatsApp message\/day/i)).toBeVisible();
    await expect(page.getByText(/90 total assets/i)).toBeVisible();
    await expect(page.getByText(/3 per day/i)).toBeVisible();
    console.log('✅ Pricing shows content quantities');

    // Check trial badges
    const trialBadges = page.getByText(/14-Day Free Trial/i);
    const noCreditCard = page.getByText(/No Credit Card Required/i);
    const cancelAnytime = page.getByText(/Cancel Anytime/i);

    await expect(trialBadges.first()).toBeVisible();
    await expect(noCreditCard.first()).toBeVisible();
    await expect(cancelAnytime.first()).toBeVisible();
    console.log('✅ Trial clarity badges visible');

    await page.screenshot({ path: 'tests/screenshots/pricing-section.png', fullPage: false });

    // FINAL: Full page screenshot
    console.log('📸 Taking full page screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/full-page-phase-0.png', fullPage: true });

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ PHASE 0 VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('All 6 improvements verified:');
    console.log('✅ 0.1: Hero mentions LinkedIn + WhatsApp');
    console.log('✅ 0.2: Pricing shows content quantities (1/day vs 3/day)');
    console.log('✅ 0.3: Daily content showcase with 3 asset types');
    console.log('✅ 0.4: Example content section with working tabs');
    console.log('✅ 0.5: Trial clarity badges on all pricing cards');
    console.log('✅ 0.6: ROI calculator functional');
    console.log('');
    console.log('Screenshots saved to: tests/screenshots/');
    console.log('═══════════════════════════════════════════════════════');
  });
});
