const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8',
      'x-vercel-set-bypass-cookie': 'samesitenone',
    }
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('Signup')) {
      errors.push(text);
      console.log('[CONSOLE]', text);
    }
  });

  console.log('🔍 Navigating to signup page...');
  await page.goto('https://finadvise-webhook.vercel.app/signup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('📝 Filling form...');
  const timestamp = Date.now();
  await page.fill('#name', 'Debug User');
  await page.fill('#email', `debug${timestamp}@test.com`);
  await page.fill('#phone', '9876543210');
  await page.fill('#password', 'TestPass123!');
  await page.click('#termsAccepted');

  console.log('🚀 Submitting...');
  await page.click('button[type="submit"]');
  
  console.log('⏳ Waiting for response (15 seconds)...');
  await page.waitForTimeout(15000);

  const errorDiv = await page.locator('.error').isVisible().catch(() => false);
  if (errorDiv) {
    const errorText = await page.locator('.error').textContent();
    console.log('\n❌ ERROR DISPLAYED:', errorText);
  }

  console.log('\n📋 All Console Logs with "error":');
  errors.forEach(e => console.log('  -', e));

  await page.screenshot({ path: 'signup-error-screenshot.png' });
  console.log('\n📸 Screenshot saved: signup-error-screenshot.png');

  await browser.close();
})();
