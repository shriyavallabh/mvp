const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeJarvisDaily() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8',
      'x-vercel-set-bypass-cookie': 'samesitenone',
    }
  });

  const page = await context.newPage();

  console.log('📊 Analyzing jarvisdaily.com...\n');

  try {
    // Navigate to website
    await page.goto('https://jarvisdaily.com', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Page loaded successfully');

    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'website-analysis');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take full-page screenshot (desktop)
    await page.screenshot({
      path: path.join(screenshotsDir, '01-desktop-fullpage.png'),
      fullPage: true
    });
    console.log('📸 Desktop full-page screenshot captured');

    // Take hero section screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '02-hero-section.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log('📸 Hero section screenshot captured');

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, '03-mobile-fullpage.png'),
      fullPage: true
    });
    console.log('📸 Mobile full-page screenshot captured');

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Extract content for analysis
    const content = await page.evaluate(() => {
      return {
        title: document.title,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim()
        })),
        buttons: Array.from(document.querySelectorAll('button, a[role="button"]')).map(btn => ({
          text: btn.textContent.trim(),
          href: btn.getAttribute('href') || 'N/A'
        })),
        ctaTexts: Array.from(document.querySelectorAll('[class*="cta"], [class*="button"]')).map(el =>
          el.textContent.trim()
        ).filter(text => text.length > 0),
        brandingElements: {
          logo: document.querySelector('img[alt*="logo" i], img[alt*="jarvis" i]')?.src || 'Not found',
          tagline: document.querySelector('[class*="tagline"], [class*="subtitle"]')?.textContent.trim() || 'Not found'
        }
      };
    });

    // Extract specific content sections
    const sections = await page.evaluate(() => {
      const sections = {};

      // Hero content
      const hero = document.querySelector('section, div[class*="hero"]') || document.querySelector('main > div:first-child');
      if (hero) {
        sections.hero = {
          headline: hero.querySelector('h1')?.textContent.trim() || '',
          subheadline: hero.querySelector('h2, p')?.textContent.trim() || '',
          cta: Array.from(hero.querySelectorAll('button, a[class*="button"]')).map(btn => btn.textContent.trim())
        };
      }

      // Look for "Grammy" mentions
      sections.grammyMentions = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent.includes('Grammy') || el.textContent.includes('grammy')
      ).map(el => el.textContent.trim()).slice(0, 10);

      // Pricing section
      const pricingSection = Array.from(document.querySelectorAll('section')).find(s =>
        s.textContent.includes('₹') || s.textContent.toLowerCase().includes('pricing')
      );
      if (pricingSection) {
        sections.pricing = {
          plans: Array.from(pricingSection.querySelectorAll('[class*="plan"], [class*="tier"], [class*="card"]')).map(plan => ({
            name: plan.querySelector('h3, h4')?.textContent.trim() || '',
            price: plan.textContent.match(/₹[\d,]+/)?.[0] || '',
            features: Array.from(plan.querySelectorAll('li, p')).map(f => f.textContent.trim()).slice(0, 5)
          }))
        };
      }

      return sections;
    });

    // Color scheme analysis
    const colors = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const mainSection = document.querySelector('main, section');
      const mainStyle = mainSection ? window.getComputedStyle(mainSection) : bodyStyle;

      return {
        background: bodyStyle.backgroundColor,
        mainBackground: mainStyle.backgroundColor,
        textColor: bodyStyle.color,
        primaryButton: document.querySelector('button, [class*="primary"]') ?
          window.getComputedStyle(document.querySelector('button, [class*="primary"]')).backgroundColor : 'N/A'
      };
    });

    // Save analysis report
    const report = {
      analyzedAt: new Date().toISOString(),
      url: 'https://jarvisdaily.com',
      pageTitle: content.title,
      colorScheme: colors,
      content: content,
      sections: sections,
      screenshots: [
        '01-desktop-fullpage.png',
        '02-hero-section.png',
        '03-mobile-fullpage.png'
      ]
    };

    fs.writeFileSync(
      path.join(screenshotsDir, 'analysis-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📝 Analysis Report:');
    console.log('==================');
    console.log(`Title: ${content.title}`);
    console.log(`\nColor Scheme:`);
    console.log(`  Background: ${colors.background}`);
    console.log(`  Main Background: ${colors.mainBackground}`);
    console.log(`  Text Color: ${colors.textColor}`);
    console.log(`\nHeadings Found: ${content.headings.length}`);
    content.headings.slice(0, 5).forEach(h => console.log(`  ${h.tag}: ${h.text}`));

    if (sections.grammyMentions.length > 0) {
      console.log(`\n🎵 "Grammy" References Found: ${sections.grammyMentions.length}`);
      sections.grammyMentions.slice(0, 3).forEach(mention => console.log(`  - ${mention.substring(0, 100)}...`));
    }

    console.log(`\n✅ Analysis complete! Reports saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Error analyzing website:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

analyzeJarvisDaily().catch(console.error);
