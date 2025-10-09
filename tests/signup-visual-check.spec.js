const { test, expect } = require('@playwright/test');

test.describe('Signup Page Visual Check', () => {
  test('Verify what is actually rendering on signup page', async ({ page }) => {
    console.log('\n🔍 Loading signup page...');
    await page.goto('http://localhost:3000/signup', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/signup-current-rendering.png',
      fullPage: true
    });

    console.log('\n📄 Page title:', await page.title());

    // Get body text to see what's rendering
    const bodyText = await page.locator('body').textContent();
    console.log('\n📝 Body content (first 500 chars):\n', bodyText.substring(0, 500));

    // Check for NEW design elements
    console.log('\n✅ Checking for NEW v0 design elements...\n');

    const createAccountHeading = page.locator('text=Create your account');
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const linkedinButton = page.locator('button:has-text("Continue with LinkedIn")');
    const testimonialPanel = page.locator('text=Vidya Patel');
    const blackBackground = page.locator('.bg-\\[\\#0A0A0A\\]');

    console.log('   "Create your account" heading:', await createAccountHeading.count());
    console.log('   Google button:', await googleButton.count());
    console.log('   LinkedIn button:', await linkedinButton.count());
    console.log('   Testimonial panel:', await testimonialPanel.count());
    console.log('   Black background div:', await blackBackground.count());

    // Check for OLD design elements (should NOT exist)
    console.log('\n❌ Checking for OLD design elements (should be 0)...\n');

    const step1of3 = page.locator('text=Step 1 of 3');
    const phoneNumberField = page.locator('text=Phone Number *');
    const purpleBackground = page.locator('css=[style*="background"]').filter({ hasText: 'purple' });

    console.log('   "Step 1 of 3":', await step1of3.count());
    console.log('   "Phone Number *" field:', await phoneNumberField.count());

    // Take screenshot of what's actually there
    console.log('\n📸 Screenshot saved to: tests/screenshots/signup-current-rendering.png');
    console.log('\n✅ Check complete!\n');
  });
});
