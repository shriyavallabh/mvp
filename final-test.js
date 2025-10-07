const { chromium } = require('@playwright/test');

(async () => {
  console.log('🎯 FINAL PRODUCTION TEST WITH FIX...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8',
      'x-vercel-set-bypass-cookie': 'samesitenone',
    }
  });

  const page = await context.newPage();
  const logs = [];

  page.on('console', msg => {
    logs.push(msg.text());
    console.log('[CONSOLE]', msg.text());
  });

  console.log('Navigating to production...');
  await page.goto('https://finadvise-webhook.vercel.app/signup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const email = 'final-test-' + Date.now() + '@gmail.com';
  console.log('\nFilling form with:', email);
  
  await page.fill('#name', 'Final Test User');
  await page.fill('#email', email);
  await page.fill('#phone', '9876543210');
  await page.fill('#password', 'TestPassword123!');
  await page.locator('input[type="checkbox"]').first().check();

  await page.screenshot({ path: 'before-final-submit.png' });
  console.log('\nSubmitting form...');
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(15000);

  const hasError = await page.locator('.error').isVisible().catch(() => false);
  const hasSuccess = await page.locator('.success').isVisible().catch(() => false);

  console.log('\n' + '='.repeat(60));
  if (hasSuccess) {
    const msg = await page.locator('.success').textContent();
    console.log('✅ SUCCESS! SIGNUP WORKS!');
    console.log('Message:', msg);
    console.log('Email used:', email);
  } else if (hasError) {
    const msg = await page.locator('.error').textContent();
    console.log('❌ FAILED');
    console.log('Error:', msg);
  } else {
    console.log('⚠️  No message visible');
  }
  console.log('='.repeat(60));

  await page.screenshot({ path: 'after-final-submit.png' });
  
  const errors = logs.filter(l => l.toLowerCase().includes('error'));
  if (errors.length > 0) {
    console.log('\nError logs:', errors);
  }

  console.log('\nScreenshots saved. Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
