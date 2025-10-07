import { test, expect } from '@playwright/test';

test('Quick sign-in page check', async ({ page }) => {
  console.log('Navigating to sign-in page...');
  await page.goto('https://finadvise-webhook.vercel.app/sign-in', { waitUntil: 'networkidle', timeout: 30000 });

  await page.screenshot({ path: 'test-results/sign-in-page-check.png', fullPage: true });

  const title = await page.title();
  console.log('Page title:', title);

  const h2Text = await page.textContent('h2').catch(() => null);
  console.log('H2 text:', h2Text);

  const bodyText = await page.textContent('body');
  console.log('Body contains (first 200 chars):', bodyText.substring(0, 200));
});
