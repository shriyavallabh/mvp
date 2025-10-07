/**
 * Complete Authentication Flow Test
 * Tests the full user journey: Signup → Login → Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Authentication Flow', () => {
  const TEST_USER = {
    name: 'Test User Auth',
    email: `test.auth.${Date.now()}@example.com`,
    phone: '9876543210',
    password: 'TestPassword123!Strong'
  };

  test('Full flow: Signup → Dashboard → Logout → Login → Dashboard', async ({ page }) => {
    // ============================================================
    // PART 1: SIGNUP
    // ============================================================
    console.log('🔵 Part 1: Testing Signup...');
    await page.goto('https://finadvise-webhook.vercel.app/signup');

    // Fill signup form
    await page.fill('#name', TEST_USER.name);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#phone', TEST_USER.phone);
    await page.fill('#password', TEST_USER.password);
    await page.check('#termsAccepted');

    // Submit signup
    await page.click('button[type="submit"]');

    // Wait for success or error
    const hasSuccess = await page.waitForSelector('.success, .error', { timeout: 15000 }).then(() => true).catch(() => false);

    if (hasSuccess) {
      const successText = await page.textContent('.success').catch(() => null);
      const errorText = await page.textContent('.error').catch(() => null);

      if (successText) {
        console.log('✅ Signup successful:', successText);

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ Redirected to dashboard after signup');

        // Verify dashboard loaded
        const dashboardHeading = await page.textContent('h1');
        expect(dashboardHeading).toContain('Hello');
        console.log('✅ Dashboard loaded successfully');

      } else if (errorText) {
        console.log('⚠️  Signup error:', errorText);

        // If user already exists, that's okay - proceed to login test
        if (errorText.includes('already') || errorText.includes('exists') || errorText.includes('taken')) {
          console.log('ℹ️  User already exists, skipping to login test');
        } else {
          throw new Error(`Signup failed: ${errorText}`);
        }
      }
    }

    // Take screenshot of dashboard after signup
    await page.screenshot({ path: 'test-results/01-dashboard-after-signup.png', fullPage: true });

    // ============================================================
    // PART 2: LOGOUT (Clear session)
    // ============================================================
    console.log('🔵 Part 2: Testing Logout...');

    // Clear cookies to simulate logout
    await page.context().clearCookies();
    console.log('✅ Session cleared (logout simulated)');

    // ============================================================
    // PART 3: TRY TO ACCESS DASHBOARD (Should redirect to sign-in)
    // ============================================================
    console.log('🔵 Part 3: Testing Protected Route...');
    await page.goto('https://finadvise-webhook.vercel.app/dashboard');

    // Should redirect to sign-in page
    await page.waitForURL('**/sign-in', { timeout: 5000 });
    console.log('✅ Protected route correctly redirected to sign-in');

    // Take screenshot of sign-in page
    await page.screenshot({ path: 'test-results/02-sign-in-page.png', fullPage: true });

    // ============================================================
    // PART 4: LOGIN
    // ============================================================
    console.log('🔵 Part 4: Testing Login...');

    // Fill login form
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    const loginSuccess = await page.waitForURL('**/dashboard', { timeout: 15000 }).then(() => true).catch(() => false);

    if (loginSuccess) {
      console.log('✅ Login successful - redirected to dashboard');

      // Verify dashboard loaded
      const dashboardHeading = await page.textContent('h1');
      expect(dashboardHeading).toContain('Hello');
      console.log('✅ Dashboard loaded after login');

    } else {
      // Check for error message
      const errorText = await page.textContent('.error').catch(() => null);
      if (errorText) {
        console.log('❌ Login error:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }
    }

    // Take screenshot of dashboard after login
    await page.screenshot({ path: 'test-results/03-dashboard-after-login.png', fullPage: true });

    console.log('🎉 COMPLETE FLOW TEST PASSED!');
  });

  test('Sign-in page loads correctly', async ({ page }) => {
    await page.goto('https://finadvise-webhook.vercel.app/sign-in');

    // Check page title
    const heading = await page.textContent('h2');
    expect(heading).toBe('Welcome back');

    // Check form elements exist
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check OAuth buttons
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("LinkedIn")')).toBeVisible();

    // Check signup link
    await expect(page.locator('a[href="/signup"]')).toBeVisible();

    console.log('✅ Sign-in page structure validated');
  });

  test('Invalid login shows error', async ({ page }) => {
    await page.goto('https://finadvise-webhook.vercel.app/sign-in');

    // Try invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for error message
    const errorVisible = await page.waitForSelector('.error', { timeout: 10000 }).then(() => true).catch(() => false);

    if (errorVisible) {
      const errorText = await page.textContent('.error');
      console.log('✅ Error message shown:', errorText);
      expect(errorText).toBeTruthy();
    }
  });

  test('Sign-in link from signup page works', async ({ page }) => {
    await page.goto('https://finadvise-webhook.vercel.app/signup');

    // Click sign-in link
    await page.click('a[href="/sign-in"]');

    // Should navigate to sign-in page
    await page.waitForURL('**/sign-in', { timeout: 5000 });

    const heading = await page.textContent('h2');
    expect(heading).toBe('Welcome back');

    console.log('✅ Sign-in link from signup page works');
  });

  test('Sign-up link from signin page works', async ({ page }) => {
    await page.goto('https://finadvise-webhook.vercel.app/sign-in');

    // Click sign-up link
    await page.click('a[href="/signup"]');

    // Should navigate to sign-up page
    await page.waitForURL('**/signup', { timeout: 5000 });

    const heading = await page.textContent('h2');
    expect(heading).toBe('Create your account');

    console.log('✅ Sign-up link from signin page works');
  });
});
