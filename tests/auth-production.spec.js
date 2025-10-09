const { test, expect } = require('@playwright/test');

/**
 * PRODUCTION AUTHENTICATION TEST
 * Tests actual production site at jarvisdaily.com
 */

const PRODUCTION_URL = 'https://jarvisdaily.com';

test.describe('Production Authentication Test', () => {

  test('Production signup page loads correctly', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/signup`, { waitUntil: 'domcontentloaded' });

    // Wait for form to be visible
    await page.waitForSelector('input[placeholder*="Enter your full name"]', { timeout: 10000 });

    // Check for OAuth buttons
    const googleButton = await page.getByRole('button', { name: /Continue with Google/i }).isVisible();
    const linkedinButton = await page.getByRole('button', { name: /Continue with LinkedIn/i }).isVisible();

    console.log('✅ Production signup page loaded');
    console.log('Google OAuth button:', googleButton ? '✅ Visible' : '❌ Missing');
    console.log('LinkedIn OAuth button:', linkedinButton ? '✅ Visible' : '❌ Missing');

    expect(googleButton).toBeTruthy();
    expect(linkedinButton).toBeTruthy();
  });

  test('Can attempt email/password signup on production', async ({ page }) => {
    // Enable console logging to see errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto(`${PRODUCTION_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder*="Enter your full name"]', { timeout: 10000 });

    // Generate unique test email
    const testEmail = `production.test.${Date.now()}@example.com`;
    console.log('Testing with email:', testEmail);

    // Fill form
    await page.getByPlaceholder(/Enter your full name/i).fill('Production Test User');
    await page.getByPlaceholder(/you@example.com/i).fill(testEmail);
    await page.getByPlaceholder(/Create a strong password/i).fill('ProductionTest123!');

    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/production-before-signup.png' });

    // Click create account
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/production-after-signup.png' });

    const currentUrl = page.url();
    console.log('URL after signup attempt:', currentUrl);

    // Check for errors
    const hasError = await page.locator('text=/error|Error|failed|Failed/i').first().isVisible().catch(() => false);
    if (hasError) {
      const errorText = await page.locator('text=/error|Error|failed|Failed/i').first().textContent();
      console.log('❌ Error on page:', errorText);
    }

    // Check if redirected
    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Successfully redirected to onboarding - EMAIL/PASSWORD SIGNUP WORKS ON PRODUCTION');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard - EMAIL/PASSWORD SIGNUP WORKS ON PRODUCTION');
    } else if (currentUrl.includes('/signup')) {
      console.log('⚠️  Still on signup page - signup may have failed');
      console.log('This matches local behavior - PRODUCTION HAS SAME ISSUE');
    }

    // Don't fail the test - we're just gathering information
    console.log('Production test complete');
  });
});
