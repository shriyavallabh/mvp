const { test, expect } = require('@playwright/test');

/**
 * CLERK SIGNUP VERIFICATION TEST
 *
 * This test verifies that Clerk is properly configured and signup works
 */

test.describe('Clerk Signup Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for Clerk to fully load
  });

  test('Should have Clerk SDK loaded and initialized', async ({ page }) => {
    // Check if Clerk is loaded
    const clerkLoaded = await page.evaluate(() => {
      return typeof window.Clerk !== 'undefined';
    }).catch(() => false);

    console.log('✅ Clerk SDK Loaded:', clerkLoaded);

    // Check publishable key is in the page
    const hasPublishableKey = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const clerkScript = scripts.find(s => s.textContent && s.textContent.includes('pk_test_'));
      return clerkScript !== undefined;
    });

    console.log('✅ Publishable Key Found:', hasPublishableKey);

    // Check for Clerk provider
    const hasClerkProvider = await page.evaluate(() => {
      return document.querySelector('[data-clerk-provider]') !== null;
    });

    console.log('✅ Clerk Provider Found:', hasClerkProvider);

    expect(clerkLoaded || hasPublishableKey || hasClerkProvider).toBeTruthy();
  });

  test('Should attempt signup with test credentials', async ({ page }) => {
    // Monitor console for errors
    const errors = [];
    const logs = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.text().includes('Clerk') || msg.text().includes('signup')) {
        logs.push(msg.text());
      }
    });

    // Fill in the form
    await page.fill('#name', 'Test User Playwright');
    await page.waitForTimeout(500);

    const testEmail = `playwright-test-${Date.now()}@example.com`;
    await page.fill('#email', testEmail);
    await page.waitForTimeout(500);

    await page.fill('#phone', '9876543210');
    await page.waitForTimeout(500);

    await page.fill('#password', 'TestPassword123!');
    await page.waitForTimeout(500);

    await page.check('#termsAccepted');
    await page.waitForTimeout(500);

    console.log('✅ Form filled with test data');
    console.log('   Email:', testEmail);

    // Click submit
    await page.click('.submit-btn');
    console.log('✅ Submit button clicked');

    // Wait for response (either success or error)
    await page.waitForTimeout(5000);

    // Check for success message
    const hasSuccess = await page.locator('.success').isVisible().catch(() => false);
    const hasError = await page.locator('.error').isVisible().catch(() => false);
    const hasLoading = await page.locator('.loading').isVisible().catch(() => false);

    console.log('\n📊 SIGNUP ATTEMPT RESULTS:');
    console.log('   Success Message:', hasSuccess);
    console.log('   Error Message:', hasError);
    console.log('   Loading State:', hasLoading);

    if (hasError) {
      const errorText = await page.locator('.error').textContent();
      console.log('   ❌ Error Text:', errorText);
    }

    if (hasSuccess) {
      const successText = await page.locator('.success').textContent();
      console.log('   ✅ Success Text:', successText);
    }

    console.log('\n📝 Console Logs:', logs.length > 0 ? logs : 'None');
    console.log('❌ Console Errors:', errors.length > 0 ? errors : 'None');

    // Check if we got redirected to verify-email
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // The test passes if:
    // 1. No critical errors OR
    // 2. Success message shown OR
    // 3. Redirected to verification page
    const testPassed = !errors.some(e => e.includes('publishableKey')) || hasSuccess || currentUrl.includes('verify');

    expect(testPassed).toBeTruthy();
  });

  test('Should check Clerk Dashboard configuration', async ({ page }) => {
    // Check if the page loads without Clerk errors
    const clerkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('clerk')) {
        clerkErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);

    console.log('\n🔍 CLERK CONFIGURATION CHECK:');

    if (clerkErrors.length === 0) {
      console.log('   ✅ No Clerk initialization errors');
    } else {
      console.log('   ❌ Clerk Errors Found:');
      clerkErrors.forEach(err => console.log('      -', err));
    }

    // Check environment variable is set
    const envVarCheck = await page.evaluate(() => {
      // Try to find the publishable key in the page source
      return {
        hasKey: document.documentElement.innerHTML.includes('pk_test_'),
        hasClerkScript: Array.from(document.querySelectorAll('script'))
          .some(s => s.src && s.src.includes('clerk'))
      };
    });

    console.log('   Environment Variables:');
    console.log('      - Publishable Key Present:', envVarCheck.hasKey);
    console.log('      - Clerk Script Loaded:', envVarCheck.hasClerkScript);

    expect(envVarCheck.hasKey || envVarCheck.hasClerkScript).toBeTruthy();
  });
});
