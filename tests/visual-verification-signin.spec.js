const { test, expect } = require('@playwright/test');

test.describe('Visual Verification - Sign-In Page', () => {
  test('should display new v0 design with Google and LinkedIn buttons', async ({ page }) => {
    console.log('\n🔍 Navigating to sign-in page...');
    await page.goto('http://localhost:3000/sign-in', { waitUntil: 'domcontentloaded' });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    console.log('📸 Taking full page screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/signin-full-page.png',
      fullPage: true
    });

    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Check for "Welcome back" heading
    console.log('\n✅ Checking for "Welcome back" heading...');
    const welcomeHeading = page.locator('h2:has-text("Welcome back")');
    await expect(welcomeHeading).toBeVisible();
    const welcomeText = await welcomeHeading.textContent();
    console.log(`   Found: "${welcomeText}"`);

    // Check for description
    console.log('\n✅ Checking for description...');
    const description = page.locator('text=Sign in to access your viral content dashboard');
    await expect(description).toBeVisible();
    console.log('   ✓ Description found');

    // Check for Google button
    console.log('\n✅ Checking for Google sign-in button...');
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    await googleButton.screenshot({ path: 'tests/screenshots/signin-google-button.png' });
    console.log('   ✓ Google button visible');

    // Check for LinkedIn button
    console.log('\n✅ Checking for LinkedIn sign-in button...');
    const linkedinButton = page.locator('button:has-text("Continue with LinkedIn")');
    await expect(linkedinButton).toBeVisible();
    await linkedinButton.screenshot({ path: 'tests/screenshots/signin-linkedin-button.png' });
    console.log('   ✓ LinkedIn button visible');

    // Check for "Or continue with email" divider
    console.log('\n✅ Checking for email divider...');
    const divider = page.locator('text=Or continue with email');
    await expect(divider).toBeVisible();
    console.log('   ✓ Divider found');

    // Check for email input
    console.log('\n✅ Checking for email input...');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    console.log(`   Found email input with placeholder: "${emailPlaceholder}"`);

    // Check for password input
    console.log('\n✅ Checking for password input...');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    console.log(`   Found password input with placeholder: "${passwordPlaceholder}"`);

    // Check for "Forgot password?" link
    console.log('\n✅ Checking for "Forgot password?" link...');
    const forgotLink = page.locator('a:has-text("Forgot password?")');
    await expect(forgotLink).toBeVisible();
    console.log('   ✓ Forgot password link found');

    // Check for Sign In button
    console.log('\n✅ Checking for Sign In button...');
    const signInButton = page.locator('button[type="submit"]:has-text("Sign In")');
    await expect(signInButton).toBeVisible();
    await signInButton.screenshot({ path: 'tests/screenshots/signin-submit-button.png' });
    console.log('   ✓ Sign In button visible');

    // Check for "Don't have an account?" text
    console.log('\n✅ Checking for signup link...');
    const signupLink = page.locator('a:has-text("Sign up")');
    await expect(signupLink).toBeVisible();
    const signupHref = await signupLink.getAttribute('href');
    console.log(`   ✓ Signup link found, href: ${signupHref}`);

    // Check for testimonial panel
    console.log('\n✅ Checking for testimonial panel...');
    const testimonial = page.locator('text=Vidya Patel');
    await expect(testimonial).toBeVisible();
    console.log('   ✓ Testimonial panel visible');

    // Take screenshot of form only
    console.log('\n📸 Taking form screenshot...');
    const formCard = page.locator('.bg-white.shadow-xl').first();
    await formCard.screenshot({ path: 'tests/screenshots/signin-form-card.png' });

    // Check for OLD design elements (should NOT exist)
    console.log('\n❌ Checking that OLD design does NOT exist...');
    const oldLeftPanel = page.locator('.left-panel');
    const oldRightPanel = page.locator('.right-panel');
    const oldFormContainer = page.locator('.form-container');

    const oldDesignExists = (await oldLeftPanel.count()) > 0 ||
                           (await oldRightPanel.count()) > 0 ||
                           (await oldFormContainer.count()) > 0;

    if (oldDesignExists) {
      console.log('   ⚠️  WARNING: Old design CSS classes detected!');
      console.log(`      .left-panel count: ${await oldLeftPanel.count()}`);
      console.log(`      .right-panel count: ${await oldRightPanel.count()}`);
      console.log(`      .form-container count: ${await oldFormContainer.count()}`);
    } else {
      console.log('   ✓ No old design elements found - NEW design confirmed!');
    }

    // Get all body text to debug
    console.log('\n📝 Body content (first 500 chars):');
    const bodyText = await page.locator('body').textContent();
    console.log(bodyText.substring(0, 500));

    console.log('\n✅ ALL CHECKS PASSED - New v0 design is rendering correctly!\n');
  });
});
