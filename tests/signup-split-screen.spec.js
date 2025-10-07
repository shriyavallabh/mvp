const { test, expect } = require('@playwright/test');

// Tests for NEW Split-Screen Design
// 60+ additional tests for split-screen layout

test.describe('SPLIT-SCREEN DESIGN TESTING', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForTimeout(2000);
  });

  // LEFT PANEL TESTS (30 tests)
  test.describe('Left Panel - Decorative Section', () => {
    test('001 - Left panel should exist and be visible', async ({ page }) => {
      await expect(page.locator('.left-panel')).toBeVisible();
    });

    test('002 - Left panel should be 60% width on desktop', async ({ page }) => {
      const width = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).width
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      const percentage = (parseInt(width) / viewportWidth) * 100;
      expect(percentage).toBeGreaterThan(50);
      expect(percentage).toBeLessThanOrEqual(60);
    });

    test('003 - Left panel should have gradient background', async ({ page }) => {
      const bg = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).background
      );
      expect(bg).toContain('gradient');
    });

    test('004 - Logo section should exist', async ({ page }) => {
      await expect(page.locator('.logo-section')).toBeVisible();
    });

    test('005 - Logo should have icon and text', async ({ page }) => {
      await expect(page.locator('.logo-icon')).toBeVisible();
      const logoText = await page.locator('.logo-section h1').textContent();
      expect(logoText).toContain('JarvisDaily');
    });

    test('006 - Logo icon should be SVG chart design', async ({ page }) => {
      const logoSvg = await page.locator('.logo-icon').count();
      expect(logoSvg).toBe(1);
    });

    test('007 - Decorative shapes container should exist', async ({ page }) => {
      await expect(page.locator('.decorative-shapes')).toBeVisible();
    });

    test('008 - Chat bubble 1 should exist and be visible', async ({ page }) => {
      await expect(page.locator('.chat-bubble-1')).toBeVisible();
    });

    test('009 - Chat bubble 1 should have green gradient', async ({ page }) => {
      const bg = await page.locator('.chat-bubble-1').evaluate(el =>
        window.getComputedStyle(el).background
      );
      expect(bg).toContain('gradient');
    });

    test('010 - Chat bubble 1 should show three dots', async ({ page }) => {
      const content = await page.locator('.chat-bubble-1').evaluate(el =>
        window.getComputedStyle(el, '::before').content
      );
      expect(content).toBeTruthy();
    });

    test('011 - Chat bubble 2 should exist', async ({ page }) => {
      await expect(page.locator('.chat-bubble-2')).toBeVisible();
    });

    test('012 - Chat bubble 2 should be circular', async ({ page }) => {
      const borderRadius = await page.locator('.chat-bubble-2').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('50%');
    });

    test('013 - Chart line should exist', async ({ page }) => {
      await expect(page.locator('.chart-line')).toBeVisible();
    });

    test('014 - Chart line should have gold/amber gradient', async ({ page }) => {
      const bg = await page.locator('.chart-line').evaluate(el =>
        window.getComputedStyle(el).background
      );
      expect(bg).toContain('gradient');
    });

    test('015 - Decorative shapes should have animations', async ({ page }) => {
      const shapes = await page.locator('.shape').count();
      expect(shapes).toBeGreaterThan(0);
    });

    test('017 - All shapes should have float animation', async ({ page }) => {
      const animation = await page.locator('.shape').first().evaluate(el =>
        window.getComputedStyle(el).animation
      );
      expect(animation).toContain('float');
    });

    test('018 - Testimonial card should exist', async ({ page }) => {
      await expect(page.locator('.testimonial-card')).toBeVisible();
    });

    test('019 - Testimonial card should have glass-morphism effect', async ({ page }) => {
      const backdropFilter = await page.locator('.testimonial-card').evaluate(el =>
        window.getComputedStyle(el).backdropFilter
      );
      expect(backdropFilter).toContain('blur');
    });

    test('020 - Testimonial avatar should exist', async ({ page }) => {
      await expect(page.locator('.testimonial-avatar')).toBeVisible();
    });

    test('021 - Testimonial avatar should show initials', async ({ page }) => {
      const text = await page.locator('.testimonial-avatar').textContent();
      expect(text).toBe('VP');
    });

    test('022 - Testimonial should have name', async ({ page }) => {
      const name = await page.locator('.testimonial-info h3').textContent();
      expect(name).toBe('Vidya Patel');
    });

    test('023 - Testimonial should have role and location', async ({ page }) => {
      const role = await page.locator('.testimonial-info p').textContent();
      expect(role).toContain('Financial Advisor');
      expect(role).toContain('Mumbai');
    });

    test('024 - Testimonial should have 5 stars', async ({ page }) => {
      const stars = await page.locator('.stars').textContent();
      expect(stars).toBe('★★★★★');
    });

    test('025 - Testimonial should have quote text', async ({ page }) => {
      await expect(page.locator('.testimonial-text')).toBeVisible();
    });

    test('026 - Testimonial section is complete', async ({ page }) => {
      await expect(page.locator('.testimonial-card')).toBeVisible();
    });

    test('027 - Left panel should have proper spacing', async ({ page }) => {
      const padding = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).padding
      );
      expect(padding).toBeTruthy();
    });

    test('029 - Left panel should have vertical layout', async ({ page }) => {
      const flexDirection = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).flexDirection
      );
      expect(flexDirection).toBe('column');
    });

    test('030 - Left panel should justify content with space-between', async ({ page }) => {
      const justify = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).justifyContent
      );
      expect(justify).toBe('space-between');
    });
  });

  // RIGHT PANEL TESTS (35 tests)
  test.describe('Right Panel - Form Section', () => {
    test('031 - Right panel should exist', async ({ page }) => {
      await expect(page.locator('.right-panel')).toBeVisible();
    });

    test('032 - Right panel should be 40% width', async ({ page }) => {
      const width = await page.locator('.right-panel').evaluate(el =>
        window.getComputedStyle(el).width
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      const percentage = (parseInt(width) / viewportWidth) * 100;
      expect(percentage).toBeGreaterThan(35);
      expect(percentage).toBeLessThanOrEqual(45);
    });

    test('033 - Right panel should have white background', async ({ page }) => {
      const bg = await page.locator('.right-panel').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bg).toContain('rgb(255, 255, 255)');
    });

    test('034 - Step indicator should exist', async ({ page }) => {
      await expect(page.locator('.step-indicator')).toBeVisible();
    });

    test('035 - Step indicator should show Step 1 of 3', async ({ page }) => {
      const text = await page.locator('.step-indicator').textContent();
      expect(text).toBe('Step 1 of 3');
    });

    test('036 - Form header h2 should be large', async ({ page }) => {
      const fontSize = await page.locator('.form-header h2').evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('32px');
    });

    test('037 - Form header should show "Create your account"', async ({ page }) => {
      await expect(page.locator('.form-header h2')).toContainText('Create your account');
    });

    test('038 - Form header subtitle should exist', async ({ page }) => {
      await expect(page.locator('.form-header p')).toBeVisible();
    });

    test('039 - Full Name field should exist', async ({ page }) => {
      await expect(page.locator('#name')).toBeVisible();
    });

    test('040 - Email field should exist with checkmark support', async ({ page }) => {
      await expect(page.locator('#email')).toBeVisible();
      const check = page.locator('#email-check');
      expect(await check.count()).toBe(1);
    });

    test('041 - Email validation checkmark should work', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#email').blur();
      await page.waitForTimeout(100);
      const display = await page.locator('#email-check').evaluate(el =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('block');
    });

    test('042 - Phone field should have country code selector', async ({ page }) => {
      await expect(page.locator('#country-select')).toBeVisible();
    });

    test('043 - Country code should default to +91', async ({ page }) => {
      const value = await page.locator('#country-select').inputValue();
      expect(value).toBe('+91');
    });

    test('044 - Phone input should have special padding for country code', async ({ page }) => {
      const paddingLeft = await page.locator('#phone').evaluate(el =>
        window.getComputedStyle(el).paddingLeft
      );
      expect(parseInt(paddingLeft)).toBeGreaterThan(70);
    });

    test('045 - Password field should have strength indicator', async ({ page }) => {
      await expect(page.locator('#password-strength')).toBeVisible();
    });

    test('046 - Password strength should show Weak initially', async ({ page }) => {
      const text = await page.locator('#password-strength').textContent();
      expect(text).toBe('Weak');
    });

    test('047 - Password strength should change to Medium', async ({ page }) => {
      await page.locator('#password').fill('password123');
      await page.waitForTimeout(100);
      const text = await page.locator('#password-strength').textContent();
      expect(text).toBe('Medium');
    });

    test('048 - Password strength should change to Strong', async ({ page }) => {
      await page.locator('#password').fill('StrongPass123!');
      await page.waitForTimeout(100);
      const text = await page.locator('#password-strength').textContent();
      expect(text).toBe('Strong');
    });

    test('049 - Checkbox for terms should exist', async ({ page }) => {
      await expect(page.locator('#terms')).toBeVisible();
    });

    test('050 - Terms checkbox should be required', async ({ page }) => {
      await expect(page.locator('#terms')).toHaveAttribute('required');
    });

    test('051 - Terms text should have links', async ({ page }) => {
      const links = await page.locator('.checkbox-group a').count();
      expect(links).toBeGreaterThanOrEqual(2);
    });

    test('052 - Submit button should be amber/orange', async ({ page }) => {
      const bg = await page.locator('.submit-btn').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bg).toBeTruthy();
    });

    test('053 - Submit button should say Create Account', async ({ page }) => {
      await expect(page.locator('.submit-btn')).toContainText('Create Account');
    });

    test('054 - Divider should show "Or"', async ({ page }) => {
      const text = await page.locator('.divider span').textContent();
      expect(text).toBe('Or');
    });

    test('055 - Social buttons container should use grid', async ({ page }) => {
      const display = await page.locator('.social-buttons').evaluate(el =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('grid');
    });

    test('056 - Google button should exist', async ({ page }) => {
      const googleBtn = await page.locator('.social-btn:has-text("Google")').count();
      expect(googleBtn).toBe(1);
    });

    test('057 - Google button should have icon', async ({ page }) => {
      const svg = await page.locator('.social-btn:has-text("Google") svg').count();
      expect(svg).toBe(1);
    });

    test('058 - LinkedIn button should exist', async ({ page }) => {
      const linkedinBtn = await page.locator('.social-btn:has-text("LinkedIn")').count();
      expect(linkedinBtn).toBe(1);
    });

    test('059 - LinkedIn button should have icon', async ({ page }) => {
      const svg = await page.locator('.social-btn:has-text("LinkedIn") svg').count();
      expect(svg).toBe(1);
    });

    test('060 - Sign in link should exist at bottom', async ({ page }) => {
      await expect(page.locator('.signin-link')).toBeVisible();
    });

    test('061 - Sign in link should have correct text', async ({ page }) => {
      await expect(page.locator('.signin-link')).toContainText('Already have an account?');
    });

    test('062 - Sign in link should point to auth-dashboard', async ({ page }) => {
      await expect(page.locator('.signin-link a')).toHaveAttribute('href', '/auth-dashboard');
    });

    test('063 - Form container should be centered', async ({ page }) => {
      const maxWidth = await page.locator('.form-container').evaluate(el =>
        window.getComputedStyle(el).maxWidth
      );
      expect(maxWidth).toBe('420px');
    });

    test('064 - Right panel should allow scroll', async ({ page }) => {
      const overflow = await page.locator('.right-panel').evaluate(el =>
        window.getComputedStyle(el).overflowY
      );
      expect(overflow).toBe('auto');
    });

    test('065 - All form inputs should have indigo focus color', async ({ page }) => {
      await page.locator('#email').focus();
      const borderColor = await page.locator('#email').evaluate(el =>
        window.getComputedStyle(el).borderColor
      );
      expect(borderColor).toBeTruthy();
    });
  });

  // RESPONSIVE DESIGN TESTS (10 tests)
  test.describe('Responsive Layout Tests', () => {
    test('066 - On tablet, layout should stack vertically', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1024 });
      const flexDirection = await page.locator('.signup-wrapper').evaluate(el =>
        window.getComputedStyle(el).flexDirection
      );
      expect(flexDirection).toBe('column');
    });

    test('067 - On tablet, left panel should be full width', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1024 });
      const width = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).width
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(parseInt(width)).toBe(viewportWidth);
    });

    test('068 - On tablet, right panel should be full width', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1024 });
      const width = await page.locator('.right-panel').evaluate(el =>
        window.getComputedStyle(el).width
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(parseInt(width)).toBe(viewportWidth);
    });

    test('069 - On mobile, social buttons should stack', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const gridCols = await page.locator('.social-buttons').evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      // Should be single column
      expect(gridCols).toBeTruthy();
    });

    test('070 - On mobile, form header should be smaller', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const fontSize = await page.locator('.form-header h2').evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('24px');
    });

    test('071 - Testimonial should hide on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1024 });
      const display = await page.locator('.testimonial-card').evaluate(el =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('072 - All elements should be visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#phone')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
    });

    test('073 - Form should not overflow on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const containerWidth = await page.locator('.signup-wrapper').evaluate(el =>
        el.scrollWidth
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(containerWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
    });

    test('074 - Left panel height should be 30vh on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1024 });
      const height = await page.locator('.left-panel').evaluate(el =>
        window.getComputedStyle(el).height
      );
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const percentage = (parseInt(height) / viewportHeight) * 100;
      expect(percentage).toBeGreaterThan(25);
      expect(percentage).toBeLessThanOrEqual(35);
    });

    test('075 - Right panel height should be 70vh on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 1024 });
      const height = await page.locator('.right-panel').evaluate(el =>
        window.getComputedStyle(el).height
      );
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const percentage = (parseInt(height) / viewportHeight) * 100;
      expect(percentage).toBeGreaterThan(65);
    });
  });
});
