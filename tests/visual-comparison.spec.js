const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Visual Comparison: HTML vs Next.js', () => {
  // Set consistent viewport for both tests
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  test('capture HTML design screenshot', async ({ page }) => {
    // Navigate to the HTML file
    const htmlPath = path.join(__dirname, '../designs/design-1.html');
    await page.goto(`file://${htmlPath}`);

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for animations

    // Capture full page screenshot
    const screenshotPath = path.join(__dirname, '../test-results/html-design-original.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`✅ HTML screenshot saved: ${screenshotPath}`);

    // Capture specific sections for detailed comparison
    await page.screenshot({
      path: path.join(__dirname, '../test-results/html-hero-section.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
  });

  test('capture Next.js version screenshot', async ({ page }) => {
    // Navigate to Next.js dev server
    await page.goto('http://localhost:3000');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for animations

    // Capture full page screenshot
    const screenshotPath = path.join(__dirname, '../test-results/nextjs-shadcn-version.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`✅ Next.js screenshot saved: ${screenshotPath}`);

    // Capture specific sections for detailed comparison
    await page.screenshot({
      path: path.join(__dirname, '../test-results/nextjs-hero-section.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
  });

  test('detailed visual comparison - hero section', async ({ page }) => {
    const results = {
      html: {},
      nextjs: {},
      differences: []
    };

    // Test HTML version
    const htmlPath = path.join(__dirname, '../designs/design-1.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');

    // Extract computed styles from HTML
    results.html.backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    results.html.logoGradient = await page.evaluate(() => {
      const logo = document.querySelector('.logo');
      return window.getComputedStyle(logo).backgroundImage;
    });

    results.html.heroHeadlineSize = await page.evaluate(() => {
      const h1 = document.querySelector('.hero h1');
      return window.getComputedStyle(h1).fontSize;
    });

    // Test Next.js version
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Extract computed styles from Next.js
    results.nextjs.backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    results.nextjs.logoGradient = await page.evaluate(() => {
      const logo = document.querySelector('a[href="/"]');
      return window.getComputedStyle(logo).backgroundImage;
    });

    results.nextjs.heroHeadlineSize = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return window.getComputedStyle(h1).fontSize;
    });

    // Compare results
    console.log('\n📊 VISUAL COMPARISON RESULTS:');
    console.log('================================\n');

    console.log('Background Color:');
    console.log(`  HTML:    ${results.html.backgroundColor}`);
    console.log(`  Next.js: ${results.nextjs.backgroundColor}`);
    if (results.html.backgroundColor !== results.nextjs.backgroundColor) {
      results.differences.push(`Background color mismatch`);
      console.log('  ❌ DIFFERENT\n');
    } else {
      console.log('  ✅ MATCH\n');
    }

    console.log('Logo Gradient:');
    console.log(`  HTML:    ${results.html.logoGradient}`);
    console.log(`  Next.js: ${results.nextjs.logoGradient}`);
    if (results.html.logoGradient !== results.nextjs.logoGradient) {
      results.differences.push(`Logo gradient mismatch`);
      console.log('  ⚠️  DIFFERENT (may be due to implementation method)\n');
    } else {
      console.log('  ✅ MATCH\n');
    }

    console.log('Hero Headline Size:');
    console.log(`  HTML:    ${results.html.heroHeadlineSize}`);
    console.log(`  Next.js: ${results.nextjs.heroHeadlineSize}`);
    if (results.html.heroHeadlineSize !== results.nextjs.heroHeadlineSize) {
      results.differences.push(`Hero headline size mismatch`);
      console.log('  ❌ DIFFERENT\n');
    } else {
      console.log('  ✅ MATCH\n');
    }

    // Save comparison results
    const resultsPath = path.join(__dirname, '../test-results/visual-comparison-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📄 Detailed results saved: ${resultsPath}\n`);

    console.log('================================');
    console.log(`Total differences found: ${results.differences.length}`);
    if (results.differences.length > 0) {
      console.log('Differences:');
      results.differences.forEach((diff, i) => {
        console.log(`  ${i + 1}. ${diff}`);
      });
    }
  });

  test('color extraction and comparison', async ({ page }) => {
    const colors = {
      html: {},
      nextjs: {}
    };

    // Extract colors from HTML
    const htmlPath = path.join(__dirname, '../designs/design-1.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');

    colors.html = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const logo = window.getComputedStyle(document.querySelector('.logo'));
      const btnPrimary = document.querySelector('.btn-primary');
      const btnPrimaryStyle = btnPrimary ? window.getComputedStyle(btnPrimary) : null;

      return {
        backgroundColor: body.backgroundColor,
        textColor: body.color,
        logoBackground: logo.backgroundImage,
        primaryButtonBackground: btnPrimaryStyle ? btnPrimaryStyle.backgroundImage : null,
        primaryButtonColor: btnPrimaryStyle ? btnPrimaryStyle.color : null
      };
    });

    // Extract colors from Next.js
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    colors.nextjs = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const logo = window.getComputedStyle(document.querySelector('a[href="/"]'));
      const btnPrimary = document.querySelector('button');
      const btnPrimaryStyle = btnPrimary ? window.getComputedStyle(btnPrimary) : null;

      return {
        backgroundColor: body.backgroundColor,
        textColor: body.color,
        logoBackground: logo.backgroundImage,
        primaryButtonBackground: btnPrimaryStyle ? btnPrimaryStyle.backgroundImage : null,
        primaryButtonColor: btnPrimaryStyle ? btnPrimaryStyle.color : null
      };
    });

    // Save color comparison
    const colorsPath = path.join(__dirname, '../test-results/color-comparison.json');
    fs.writeFileSync(colorsPath, JSON.stringify(colors, null, 2));

    console.log('\n🎨 COLOR COMPARISON:');
    console.log('===================\n');
    console.log('Background Color:');
    console.log(`  HTML:    ${colors.html.backgroundColor}`);
    console.log(`  Next.js: ${colors.nextjs.backgroundColor}`);
    console.log(`  Match: ${colors.html.backgroundColor === colors.nextjs.backgroundColor ? '✅' : '❌'}\n`);

    console.log('Text Color:');
    console.log(`  HTML:    ${colors.html.textColor}`);
    console.log(`  Next.js: ${colors.nextjs.textColor}`);
    console.log(`  Match: ${colors.html.textColor === colors.nextjs.textColor ? '✅' : '❌'}\n`);

    console.log(`📄 Full color comparison saved: ${colorsPath}`);
  });

  test('layout measurements comparison', async ({ page }) => {
    const measurements = {
      html: {},
      nextjs: {}
    };

    // Measure HTML layout
    const htmlPath = path.join(__dirname, '../designs/design-1.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');

    measurements.html = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const heroBox = hero ? hero.getBoundingClientRect() : null;
      const h1 = document.querySelector('.hero h1');
      const h1Box = h1 ? h1.getBoundingClientRect() : null;
      const nav = document.querySelector('nav');
      const navBox = nav ? nav.getBoundingClientRect() : null;

      return {
        navHeight: navBox ? navBox.height : null,
        heroHeight: heroBox ? heroBox.height : null,
        heroHeadlineHeight: h1Box ? h1Box.height : null,
        heroHeadlineWidth: h1Box ? h1Box.width : null,
        pageWidth: document.body.scrollWidth,
        pageHeight: document.body.scrollHeight
      };
    });

    // Measure Next.js layout
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    measurements.nextjs = await page.evaluate(() => {
      const hero = document.querySelector('section');
      const heroBox = hero ? hero.getBoundingClientRect() : null;
      const h1 = document.querySelector('h1');
      const h1Box = h1 ? h1.getBoundingClientRect() : null;
      const nav = document.querySelector('nav');
      const navBox = nav ? nav.getBoundingClientRect() : null;

      return {
        navHeight: navBox ? navBox.height : null,
        heroHeight: heroBox ? heroBox.height : null,
        heroHeadlineHeight: h1Box ? h1Box.height : null,
        heroHeadlineWidth: h1Box ? h1Box.width : null,
        pageWidth: document.body.scrollWidth,
        pageHeight: document.body.scrollHeight
      };
    });

    // Save measurements
    const measurementsPath = path.join(__dirname, '../test-results/layout-measurements.json');
    fs.writeFileSync(measurementsPath, JSON.stringify(measurements, null, 2));

    console.log('\n📏 LAYOUT MEASUREMENTS:');
    console.log('======================\n');

    console.log('Navigation Height:');
    console.log(`  HTML:    ${measurements.html.navHeight}px`);
    console.log(`  Next.js: ${measurements.nextjs.navHeight}px`);
    console.log(`  Difference: ${Math.abs(measurements.html.navHeight - measurements.nextjs.navHeight).toFixed(2)}px\n`);

    console.log('Hero Section Height:');
    console.log(`  HTML:    ${measurements.html.heroHeight}px`);
    console.log(`  Next.js: ${measurements.nextjs.heroHeight}px`);
    console.log(`  Difference: ${Math.abs(measurements.html.heroHeight - measurements.nextjs.heroHeight).toFixed(2)}px\n`);

    console.log('Hero Headline Height:');
    console.log(`  HTML:    ${measurements.html.heroHeadlineHeight}px`);
    console.log(`  Next.js: ${measurements.nextjs.heroHeadlineHeight}px`);
    console.log(`  Difference: ${Math.abs(measurements.html.heroHeadlineHeight - measurements.nextjs.heroHeadlineHeight).toFixed(2)}px\n`);

    console.log(`📄 Full measurements saved: ${measurementsPath}`);
  });
});

// Summary test that runs last
test('generate comparison summary report', async () => {
  const reportPath = path.join(__dirname, '../test-results/comparison-summary.md');

  const summary = `# Visual Comparison Summary: HTML vs Next.js

## Screenshots Captured

1. **Full Page Screenshots**
   - \`html-design-original.png\` - Original HTML design
   - \`nextjs-shadcn-version.png\` - Next.js + Shadcn version

2. **Hero Section Screenshots**
   - \`html-hero-section.png\` - HTML hero (first viewport)
   - \`nextjs-hero-section.png\` - Next.js hero (first viewport)

## Analysis Files

- \`visual-comparison-results.json\` - Computed style comparisons
- \`color-comparison.json\` - Color extraction and matching
- \`layout-measurements.json\` - Layout dimension measurements

## How to Review

### Side-by-Side Comparison

Open both screenshots in separate windows/tabs:

\`\`\`bash
open test-results/html-design-original.png
open test-results/nextjs-shadcn-version.png
\`\`\`

### Check These Elements

1. **Background Color** - Should be pure black (#0A0A0A)
2. **Logo Gradient** - Purple to light purple (135deg)
3. **Hero Text Gradient** - White → Purple → Dark Purple
4. **Button Gradients** - Dark purple gradient with glow
5. **Phone Mockup** - 3D tilt and WhatsApp colors
6. **Typography** - Inter font, sizes matching
7. **Spacing** - Padding/margins consistent
8. **Animations** - Hover effects and transitions

### JSON Reports

Check the JSON files for detailed pixel-level comparisons:

\`\`\`bash
cat test-results/visual-comparison-results.json
cat test-results/color-comparison.json
cat test-results/layout-measurements.json
\`\`\`

## Expected Differences

Some differences are acceptable due to implementation:

1. **Gradient implementation** - CSS vs Tailwind may render slightly differently
2. **Font loading** - Local fonts vs Google Fonts CDN
3. **Image rendering** - Browser differences
4. **Animation timing** - May differ by milliseconds

## Action Items

If you find significant visual differences:

1. List the specific element that differs
2. Note the expected vs actual appearance
3. Reference the screenshot location
4. I'll adjust the Next.js code to match exactly

---

**Generated**: ${new Date().toISOString()}
**Test Suite**: Playwright Visual Comparison
**Viewport**: 1920x1080
`;

  fs.writeFileSync(reportPath, summary);
  console.log(`\n📋 Comparison summary report generated: ${reportPath}`);
});
