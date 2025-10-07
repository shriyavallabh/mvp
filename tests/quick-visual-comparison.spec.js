const { test } = require('@playwright/test');
const path = require('path');

test.describe('Quick Visual Comparison', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('capture both versions for comparison', async ({ page }) => {
    // Capture HTML version
    console.log('\n📸 Capturing HTML design...');
    const htmlPath = path.join(__dirname, '../designs/design-1.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(__dirname, '../test-results/html-full.png'),
      fullPage: true
    });
    console.log('✅ HTML screenshot saved: test-results/html-full.png');

    // Capture Next.js version (try multiple ports)
    console.log('\n📸 Capturing Next.js version...');
    const ports = [3002, 3000, 3001];
    let captured = false;

    for (const port of ports) {
      try {
        await page.goto(`http://localhost:${port}`, { timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(__dirname, '../test-results/nextjs-full.png'),
          fullPage: true
        });
        console.log(`✅ Next.js screenshot saved: test-results/nextjs-full.png (port ${port})`);
        captured = true;
        break;
      } catch (e) {
        console.log(`⏭️  Port ${port} not available, trying next...`);
      }
    }

    if (!captured) {
      console.log('❌ Could not capture Next.js screenshot - server may not be running');
    }

    // Capture hero sections only
    console.log('\n📸 Capturing hero sections...');

    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(__dirname, '../test-results/html-hero.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });

    for (const port of ports) {
      try {
        await page.goto(`http://localhost:${port}`, { timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        await page.screenshot({
          path: path.join(__dirname, '../test-results/nextjs-hero.png'),
          clip: { x: 0, y: 0, width: 1920, height: 1080 }
        });
        console.log(`✅ Hero sections captured`);
        break;
      } catch (e) {
        // Continue
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📁 SCREENSHOTS SAVED TO:');
    console.log('='.repeat(60));
    console.log('  test-results/html-full.png          - Full HTML page');
    console.log('  test-results/nextjs-full.png        - Full Next.js page');
    console.log('  test-results/html-hero.png          - HTML hero section');
    console.log('  test-results/nextjs-hero.png        - Next.js hero section');
    console.log('='.repeat(60));
    console.log('\nTo view side-by-side:');
    console.log('  open test-results/html-full.png test-results/nextjs-full.png');
  });
});
