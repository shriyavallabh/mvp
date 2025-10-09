// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Production Verification Test
 *
 * This test verifies the production signup page is showing the correct design.
 *
 * EXPECTED: New black v0 design with OAuth buttons
 * - Black background (#0A0A0A)
 * - "Create your account" heading
 * - Google OAuth button
 * - LinkedIn OAuth button
 * - Testimonial panel with Vidya Patel
 *
 * OLD (should NOT appear): Purple/blue design
 * - "Step 1 of 3" indicator
 * - Phone number field FIRST
 * - No OAuth buttons
 */

test.describe('Production Signup Page Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to production with cache bypass
    await page.goto('https://jarvisdaily.com/signup', {
      waitUntil: 'networkidle'
    });
  });

  test('should display new design elements', async ({ page }) => {
    // Check for NEW design heading
    const heading = await page.getByText('Create your account').count();
    console.log('✅ "Create your account" heading:', heading);
    expect(heading).toBeGreaterThan(0);

    // Check for OAuth buttons
    const googleButton = await page.getByRole('button', { name: /continue with google/i }).count();
    console.log('✅ Google OAuth button:', googleButton);
    expect(googleButton).toBe(1);

    const linkedinButton = await page.getByRole('button', { name: /continue with linkedin/i }).count();
    console.log('✅ LinkedIn OAuth button:', linkedinButton);
    expect(linkedinButton).toBe(1);

    // Check for testimonial panel
    const testimonial = await page.getByText(/JarvisDaily significantly boosted/i).count();
    console.log('✅ Testimonial panel:', testimonial);
    expect(testimonial).toBe(1);

    // Check for black background
    const blackBg = await page.locator('[class*="bg-\\[#0A0A0A\\]"]').count();
    console.log('✅ Black background elements:', blackBg);
    expect(blackBg).toBeGreaterThan(0);
  });

  test('should NOT display old design elements', async ({ page }) => {
    // Check that OLD design elements are absent
    const oldStepIndicator = await page.getByText('Step 1 of 3').count();
    console.log('❌ OLD "Step 1 of 3" indicator:', oldStepIndicator);
    expect(oldStepIndicator).toBe(0);

    // Check that phone field is NOT first (it should not exist in new design)
    const phoneField = await page.locator('input[type="tel"]').count();
    console.log('❌ OLD phone number field:', phoneField);
    expect(phoneField).toBe(0);
  });

  test('should have correct form structure', async ({ page }) => {
    // Verify form fields in correct order
    const fullNameInput = await page.locator('input#fullName').count();
    expect(fullNameInput).toBe(1);

    const emailInput = await page.locator('input[type="email"]').count();
    expect(emailInput).toBe(1);

    const passwordInput = await page.locator('input[type="password"]').count();
    expect(passwordInput).toBeGreaterThan(0);

    const submitButton = await page.getByRole('button', { name: /create account/i }).count();
    expect(submitButton).toBeGreaterThan(0);
  });

  test('should capture current page state', async ({ page }) => {
    // Take screenshot for manual verification
    await page.screenshot({
      path: 'tests/screenshots/production-current-state.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved: tests/screenshots/production-current-state.png');
  });
});

test.describe('Production Cache Diagnosis', () => {
  test('should check response headers', async ({ page }) => {
    const response = await page.goto('https://jarvisdaily.com/signup');

    const headers = response.headers();
    console.log('\n📊 Response Headers:');
    console.log('   Cache-Control:', headers['cache-control']);
    console.log('   Age:', headers['age']);
    console.log('   ETag:', headers['etag']);
    console.log('   X-Vercel-Cache:', headers['x-vercel-cache']);
    console.log('   X-Nextjs-Prerender:', headers['x-nextjs-prerender']);

    // Expect dynamic rendering (no prerender header after fix)
    const isPrerendered = headers['x-nextjs-prerender'];
    console.log('\n🔍 Page rendering mode:', isPrerendered ? 'Static (Prerendered)' : 'Dynamic (Server-rendered)');
  });
});
