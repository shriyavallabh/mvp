const { chromium } = require('@playwright/test');

async function testSignup(browser, scenario) {
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
    if (text.includes('error') || text.includes('Error')) {
      errors.push(text);
    }
  });

  await page.goto('https://finadvise-webhook.vercel.app/signup');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n' + '='.repeat(70));
  console.log(`SCENARIO: ${scenario.name}`);
  console.log('='.repeat(70));

  await page.fill('#name', scenario.name);
  await page.fill('#email', scenario.email);
  await page.fill('#phone', scenario.phone);
  await page.fill('#password', scenario.password);
  await page.locator('input[type="checkbox"]').first().check();

  console.log('Data entered:');
  console.log('  Name:', scenario.name);
  console.log('  Email:', scenario.email);
  console.log('  Phone:', scenario.phone);
  console.log('  Password:', scenario.password.replace(/./g, '*'));

  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);

  const errorVisible = await page.locator('.error').isVisible().catch(() => false);
  const successVisible = await page.locator('.success').isVisible().catch(() => false);

  if (errorVisible) {
    const errorText = await page.locator('.error').textContent();
    console.log('\n❌ ERROR:', errorText);
  }

  if (successVisible) {
    const successText = await page.locator('.success').textContent();
    console.log('\n✅ SUCCESS:', successText);
  }

  if (errors.length > 0) {
    console.log('\nConsole Errors:');
    errors.forEach(e => console.log('  -', e));
  }

  await context.close();
  return { errorVisible, successVisible, errorText: errorVisible ? await page.locator('.error').textContent() : null };
}

(async () => {
  console.log('🔍 TESTING MULTIPLE SIGNUP SCENARIOS...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });

  const scenarios = [
    {
      name: 'Single Name',
      email: `single${Date.now()}@gmail.com`,
      phone: '9876543210',
      password: 'UniquePass123!@#'
    },
    {
      name: 'First Last',
      email: `double${Date.now()}@gmail.com`,
      phone: '9876543210',
      password: 'AnotherUnique456!@#'
    },
    {
      name: 'First Middle Last',
      email: `triple${Date.now()}@gmail.com`,
      phone: '9876543210',
      password: 'ComplexPass789!@#'
    },
    {
      name: 'Test User',
      email: `common${Date.now()}@gmail.com`,
      phone: '9876543210',
      password: 'Password123'
    }
  ];

  for (const scenario of scenarios) {
    await testSignup(browser, scenario);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('ALL SCENARIOS TESTED');
  console.log('='.repeat(70));
  console.log('\nKeeping browser open for 10 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
})();
