const { test, expect } = require('@playwright/test');

/**
 * SIMPLIFIED AUTHENTICATION TEST
 * Testing actual user flow without networkidle waits
 */

const BASE_URL = 'http://localhost:3001';

test.describe('Simple Auth Test', () => {

  test('Can create account and reach onboarding', async ({ page, context }) => {
    // Enable console logging to see errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Navigate to signup
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });

    // Wait for form to be visible
    await page.waitForSelector('input[placeholder*="Enter your full name"]', { timeout: 10000 });

    // Generate unique email
    const uniqueEmail = `test.${Date.now()}@example.com`;
    console.log('Creating account with email:', uniqueEmail);

    // Fill form
    await page.getByPlaceholder(/Enter your full name/i).fill('Test User');
    await page.getByPlaceholder(/you@example.com/i).fill(uniqueEmail);
    await page.getByPlaceholder(/Create a strong password/i).fill('TestPassword123!');

    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-signup-click.png' });

    // Click create account
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/after-signup-click.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after signup:', currentUrl);

    // Check if there's an error message on the page
    const pageText = await page.textContent('body');

    if (pageText.includes('error') || pageText.includes('Error') || pageText.includes('failed') || pageText.includes('Failed')) {
      console.log('ERROR DETECTED ON PAGE');
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]');
        return Array.from(errorElements).map(el => el.textContent).join(' | ');
      });
      console.log('Error text:', errorText);
    }

    // Check if we're still on signup page
    if (currentUrl.includes('/signup')) {
      console.log('❌ Still on signup page - account creation may have failed');

      // Try to find specific error messages
      const clerkError = await page.locator('text=/Clerk|clerk/i').first().textContent().catch(() => null);
      if (clerkError) {
        console.log('Clerk-related message:', clerkError);
      }
    } else if (currentUrl.includes('/onboarding')) {
      console.log('✅ Successfully redirected to onboarding!');
    } else {
      console.log('Redirected to unexpected URL:', currentUrl);
    }

    // Final assertion
    const isSuccess = currentUrl.includes('/onboarding') || currentUrl.includes('/dashboard');
    expect(isSuccess).toBeTruthy();
  });

  test('Can sign in with email/password', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // First, create an account
    const uniqueEmail = `signin.test.${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log('Step 1: Creating account');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder*="Enter your full name"]');

    await page.getByPlaceholder(/Enter your full name/i).fill('Sign In Test');
    await page.getByPlaceholder(/you@example.com/i).fill(uniqueEmail);
    await page.getByPlaceholder(/Create a strong password/i).fill(password);
    await page.getByRole('button', { name: /Create Account/i }).click();

    await page.waitForTimeout(3000);

    const signupUrl = page.url();
    console.log('URL after signup:', signupUrl);

    // If signup succeeded, we should be at onboarding or dashboard
    if (signupUrl.includes('/onboarding') || signupUrl.includes('/dashboard')) {
      console.log('✅ Account created successfully');

      // Now try to sign in (this tests if the account exists)
      console.log('Step 2: Testing sign-in');
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[placeholder*="you@example.com"]');

      await page.getByPlaceholder(/you@example.com/i).fill(uniqueEmail);
      await page.getByPlaceholder(/Enter your password/i).fill(password);
      await page.getByRole('button', { name: /^Sign In$/i }).click();

      await page.waitForTimeout(3000);

      const signinUrl = page.url();
      console.log('URL after sign-in:', signinUrl);

      const isSignInSuccess = signinUrl.includes('/dashboard') || signinUrl.includes('/onboarding');
      if (isSignInSuccess) {
        console.log('✅ Sign-in successful!');
      } else {
        console.log('❌ Sign-in failed - still on sign-in page');
      }

      expect(isSignInSuccess).toBeTruthy();
    } else {
      console.log('❌ Signup failed, skipping sign-in test');
      expect(signupUrl).toContain('/onboarding');
    }
  });
});
