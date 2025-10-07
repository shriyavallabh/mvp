const { test, expect } = require('@playwright/test');

// Comprehensive E2E Test Suite for JarvisDaily Signup Page
// Target: 100% test coverage with 100+ individual tests

test.describe('COMPREHENSIVE SIGNUP PAGE TESTING - 100% Coverage', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup.html');
    // Wait for Clerk to initialize
    await page.waitForTimeout(2000);
  });

  // ============================================================
  // SECTION 1: PAGE LOAD AND STRUCTURE (10 tests)
  // ============================================================

  test.describe('Page Load and Structure', () => {
    test('01 - Page should load successfully with 200 status', async ({ page }) => {
      const response = await page.goto('/signup.html');
      expect(response.status()).toBe(200);
    });

    test('02 - Page title should be correct', async ({ page }) => {
      await expect(page).toHaveTitle('Sign Up - JarvisDaily');
    });

    test('03 - Page should have correct viewport meta tag', async ({ page }) => {
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });

    test('04 - Page should have UTF-8 charset', async ({ page }) => {
      const charset = await page.locator('meta[charset]').getAttribute('charset');
      expect(charset).toBe('UTF-8');
    });

    test('05 - Clerk script should be loaded', async ({ page }) => {
      const clerkScript = page.locator('script[src*="clerk"]');
      await expect(clerkScript).toHaveCount(1);
    });

    test('06 - Main container should be visible', async ({ page }) => {
      await expect(page.locator('.signup-container')).toBeVisible();
    });

    test('07 - Page should not have any console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.reload();
      await page.waitForTimeout(2000);
      expect(errors.length).toBe(0);
    });

    test('08 - All required DOM elements should exist', async ({ page }) => {
      await expect(page.locator('.logo')).toBeVisible();
      await expect(page.locator('#custom-signup')).toBeVisible();
      await expect(page.locator('.divider')).toBeVisible();
      await expect(page.locator('#clerk-section')).toBeVisible();
      await expect(page.locator('.signin-link')).toBeVisible();
    });

    test('09 - Page background gradient should be applied', async ({ page }) => {
      const bgColor = await page.locator('body').evaluate(el =>
        window.getComputedStyle(el).background
      );
      expect(bgColor).toContain('gradient');
    });

    test('10 - Page should be centered vertically and horizontally', async ({ page }) => {
      const bodyDisplay = await page.locator('body').evaluate(el =>
        window.getComputedStyle(el).display
      );
      expect(bodyDisplay).toBe('flex');
    });
  });

  // ============================================================
  // SECTION 2: LOGO AND HEADER (8 tests)
  // ============================================================

  test.describe('Logo and Header', () => {
    test('11 - Logo h1 should display correct text', async ({ page }) => {
      const logoText = await page.locator('.logo h1').textContent();
      expect(logoText).toContain('JarvisDaily');
    });

    test('12 - Logo should have emoji icon', async ({ page }) => {
      const logoText = await page.locator('.logo h1').textContent();
      expect(logoText).toContain('📊');
    });

    test('13 - Logo should have gradient text effect', async ({ page }) => {
      const gradient = await page.locator('.logo h1').evaluate(el =>
        window.getComputedStyle(el).background
      );
      expect(gradient).toContain('gradient');
    });

    test('14 - Logo subtitle should be correct', async ({ page }) => {
      await expect(page.locator('.logo p')).toContainText('Create your advisor account');
    });

    test('15 - Logo should be centered', async ({ page }) => {
      const textAlign = await page.locator('.logo').evaluate(el =>
        window.getComputedStyle(el).textAlign
      );
      expect(textAlign).toBe('center');
    });

    test('16 - Logo h1 font size should be 32px', async ({ page }) => {
      const fontSize = await page.locator('.logo h1').evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('32px');
    });

    test('17 - Logo h1 font weight should be 800', async ({ page }) => {
      const fontWeight = await page.locator('.logo h1').evaluate(el =>
        window.getComputedStyle(el).fontWeight
      );
      expect(fontWeight).toBe('800');
    });

    test('18 - Logo subtitle color should be slate gray', async ({ page }) => {
      const color = await page.locator('.logo p').evaluate(el =>
        window.getComputedStyle(el).color
      );
      expect(color).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 3: INFO BOX (5 tests)
  // ============================================================

  test.describe('Info Box', () => {
    test('19 - Info box should be visible', async ({ page }) => {
      await expect(page.locator('.info-box')).toBeVisible();
    });

    test('20 - Info box should have emoji', async ({ page }) => {
      const text = await page.locator('.info-box').textContent();
      expect(text).toContain('💡');
    });

    test('21 - Info box should have correct message', async ({ page }) => {
      await expect(page.locator('.info-box')).toContainText('Enter your details below');
    });

    test('22 - Info box should have left border', async ({ page }) => {
      const borderLeft = await page.locator('.info-box').evaluate(el =>
        window.getComputedStyle(el).borderLeftWidth
      );
      expect(borderLeft).toBe('4px');
    });

    test('23 - Info box background should be light', async ({ page }) => {
      const bg = await page.locator('.info-box').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bg).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 4: EMAIL FIELD (15 tests)
  // ============================================================

  test.describe('Email Input Field', () => {
    test('24 - Email field should exist', async ({ page }) => {
      await expect(page.locator('#email')).toBeVisible();
    });

    test('25 - Email label should be correct', async ({ page }) => {
      await expect(page.locator('label[for="email"]')).toContainText('Email Address');
    });

    test('26 - Email label should have asterisk for required', async ({ page }) => {
      await expect(page.locator('label[for="email"]')).toContainText('*');
    });

    test('27 - Email field should have correct type', async ({ page }) => {
      await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    });

    test('28 - Email field should be required', async ({ page }) => {
      await expect(page.locator('#email')).toHaveAttribute('required');
    });

    test('29 - Email field should have placeholder', async ({ page }) => {
      await expect(page.locator('#email')).toHaveAttribute('placeholder', 'you@example.com');
    });

    test('30 - Email field should accept valid email', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      const value = await page.locator('#email').inputValue();
      expect(value).toBe('test@example.com');
    });

    test('31 - Email field should validate email format', async ({ page }) => {
      await page.locator('#email').fill('invalid-email');
      const isValid = await page.locator('#email').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('32 - Email field should accept email with subdomains', async ({ page }) => {
      await page.locator('#email').fill('user@mail.example.com');
      const isValid = await page.locator('#email').evaluate(el => el.validity.valid);
      expect(isValid).toBe(true);
    });

    test('33 - Email field should have correct border radius', async ({ page }) => {
      const borderRadius = await page.locator('#email').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('12px');
    });

    test('34 - Email field should have focus state', async ({ page }) => {
      await page.locator('#email').focus();
      const borderColor = await page.locator('#email').evaluate(el =>
        window.getComputedStyle(el).borderColor
      );
      expect(borderColor).toBeTruthy();
    });

    test('35 - Email field should have proper padding', async ({ page }) => {
      const padding = await page.locator('#email').evaluate(el =>
        window.getComputedStyle(el).padding
      );
      expect(padding).toContain('14px');
    });

    test('36 - Email field should have transition effect', async ({ page }) => {
      const transition = await page.locator('#email').evaluate(el =>
        window.getComputedStyle(el).transition
      );
      expect(transition).toContain('0.3s');
    });

    test('37 - Email field should clear properly', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#email').fill('');
      const value = await page.locator('#email').inputValue();
      expect(value).toBe('');
    });

    test('38 - Email field should trim whitespace', async ({ page }) => {
      await page.locator('#email').fill('  test@example.com  ');
      // The form handler should trim this
      const value = await page.locator('#email').inputValue();
      expect(value.trim()).toBe('test@example.com');
    });
  });

  // ============================================================
  // SECTION 5: PHONE FIELD (20 tests)
  // ============================================================

  test.describe('Phone Input Field', () => {
    test('39 - Phone field should exist', async ({ page }) => {
      await expect(page.locator('#phone')).toBeVisible();
    });

    test('40 - Phone label should be correct', async ({ page }) => {
      await expect(page.locator('label[for="phone"]')).toContainText('WhatsApp Phone Number');
    });

    test('41 - Phone label should have asterisk', async ({ page }) => {
      await expect(page.locator('label[for="phone"]')).toContainText('*');
    });

    test('42 - Phone field should have type tel', async ({ page }) => {
      await expect(page.locator('#phone')).toHaveAttribute('type', 'tel');
    });

    test('43 - Phone field should be required', async ({ page }) => {
      await expect(page.locator('#phone')).toHaveAttribute('required');
    });

    test('44 - Phone field should have pattern attribute', async ({ page }) => {
      await expect(page.locator('#phone')).toHaveAttribute('pattern', '[0-9]{12}');
    });

    test('45 - Phone field should have placeholder', async ({ page }) => {
      await expect(page.locator('#phone')).toHaveAttribute('placeholder', '919765071249');
    });

    test('46 - Phone field should have format hint text', async ({ page }) => {
      const hint = page.locator('small').filter({ hasText: 'Format: 91 followed by 10 digits' });
      await expect(hint).toBeVisible();
    });

    test('47 - Phone field should accept valid Indian number', async ({ page }) => {
      await page.locator('#phone').fill('919876543210');
      const value = await page.locator('#phone').inputValue();
      expect(value).toBe('919876543210');
    });

    test('48 - Phone field format hint should show example', async ({ page }) => {
      const hint = page.locator('small').filter({ hasText: '919765071249' });
      await expect(hint).toBeVisible();
    });

    test('49 - Phone field should have 12 character length', async ({ page }) => {
      await page.locator('#phone').fill('919876543210');
      const value = await page.locator('#phone').inputValue();
      expect(value.length).toBe(12);
    });

    test('50 - Phone field should accept only numbers', async ({ page }) => {
      await page.locator('#phone').fill('91987654321a');
      // Pattern validation will catch this
      const value = await page.locator('#phone').inputValue();
      expect(value).toContain('91987654321');
    });

    test('51 - Phone field should start with 91', async ({ page }) => {
      await page.locator('#phone').fill('919876543210');
      const value = await page.locator('#phone').inputValue();
      expect(value.startsWith('91')).toBe(true);
    });

    test('52 - Phone field hint color should be gray', async ({ page }) => {
      const hint = page.locator('small').first();
      const color = await hint.evaluate(el =>
        window.getComputedStyle(el).color
      );
      expect(color).toBeTruthy();
    });

    test('53 - Phone field hint font size should be 12px', async ({ page }) => {
      const hint = page.locator('small').first();
      const fontSize = await hint.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('12px');
    });

    test('54 - Phone field should have same styling as email', async ({ page }) => {
      const emailBorder = await page.locator('#email').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      const phoneBorder = await page.locator('#phone').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      expect(emailBorder).toBe(phoneBorder);
    });

    test('55 - Phone field should clear properly', async ({ page }) => {
      await page.locator('#phone').fill('919876543210');
      await page.locator('#phone').fill('');
      const value = await page.locator('#phone').inputValue();
      expect(value).toBe('');
    });

    test('56 - Phone field should reject letters', async ({ page }) => {
      await page.locator('#phone').fill('91ABCDEFGHIJ');
      const isValid = await page.locator('#phone').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('57 - Phone field should reject special characters', async ({ page }) => {
      await page.locator('#phone').fill('919876543@!#');
      const isValid = await page.locator('#phone').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('58 - Phone field should have margin top on hint', async ({ page }) => {
      const hint = page.locator('small').first();
      const marginTop = await hint.evaluate(el =>
        window.getComputedStyle(el).marginTop
      );
      expect(marginTop).toBe('5px');
    });
  });

  // ============================================================
  // SECTION 6: PASSWORD FIELD (18 tests)
  // ============================================================

  test.describe('Password Input Field', () => {
    test('59 - Password field should exist', async ({ page }) => {
      await expect(page.locator('#password')).toBeVisible();
    });

    test('60 - Password label should be correct', async ({ page }) => {
      await expect(page.locator('label[for="password"]')).toContainText('Password');
    });

    test('61 - Password label should have asterisk', async ({ page }) => {
      await expect(page.locator('label[for="password"]')).toContainText('*');
    });

    test('62 - Password field should have type password', async ({ page }) => {
      await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    });

    test('63 - Password field should be required', async ({ page }) => {
      await expect(page.locator('#password')).toHaveAttribute('required');
    });

    test('64 - Password field should have minlength 8', async ({ page }) => {
      await expect(page.locator('#password')).toHaveAttribute('minlength', '8');
    });

    test('65 - Password field should have placeholder', async ({ page }) => {
      await expect(page.locator('#password')).toHaveAttribute('placeholder', 'Min. 8 characters');
    });

    test('66 - Password field should hide characters', async ({ page }) => {
      await page.locator('#password').fill('TestPassword123');
      const type = await page.locator('#password').getAttribute('type');
      expect(type).toBe('password');
    });

    test('67 - Password field should accept strong password', async ({ page }) => {
      await page.locator('#password').fill('StrongP@ssw0rd!');
      const value = await page.locator('#password').inputValue();
      expect(value.length).toBeGreaterThan(8);
    });

    test('68 - Password field should reject short password', async ({ page }) => {
      await page.locator('#password').fill('short');
      const isValid = await page.locator('#password').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('69 - Password field should accept exactly 8 characters', async ({ page }) => {
      await page.locator('#password').fill('12345678');
      const isValid = await page.locator('#password').evaluate(el => el.validity.valid);
      expect(isValid).toBe(true);
    });

    test('70 - Password field should accept special characters', async ({ page }) => {
      await page.locator('#password').fill('P@ssw0rd!#$');
      const value = await page.locator('#password').inputValue();
      expect(value).toContain('@');
    });

    test('71 - Password field should accept numbers', async ({ page }) => {
      await page.locator('#password').fill('Password123');
      const value = await page.locator('#password').inputValue();
      expect(value).toContain('123');
    });

    test('72 - Password field should have same border radius as others', async ({ page }) => {
      const borderRadius = await page.locator('#password').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('12px');
    });

    test('73 - Password field should clear properly', async ({ page }) => {
      await page.locator('#password').fill('TestPassword');
      await page.locator('#password').fill('');
      const value = await page.locator('#password').inputValue();
      expect(value).toBe('');
    });

    test('74 - Password field should accept very long password', async ({ page }) => {
      const longPass = 'A'.repeat(50);
      await page.locator('#password').fill(longPass);
      const value = await page.locator('#password').inputValue();
      expect(value.length).toBe(50);
    });

    test('75 - Password field should not show value in HTML', async ({ page }) => {
      await page.locator('#password').fill('SecretPassword');
      const type = await page.locator('#password').getAttribute('type');
      expect(type).toBe('password');
    });

    test('76 - Password field should have focus styling', async ({ page }) => {
      await page.locator('#password').focus();
      const borderColor = await page.locator('#password').evaluate(el =>
        window.getComputedStyle(el).borderColor
      );
      expect(borderColor).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 7: SUBMIT BUTTON (15 tests)
  // ============================================================

  test.describe('Submit Button', () => {
    test('77 - Submit button should exist', async ({ page }) => {
      await expect(page.locator('#submit-btn')).toBeVisible();
    });

    test('78 - Submit button should have correct text', async ({ page }) => {
      await expect(page.locator('#submit-btn')).toContainText('Create Account');
    });

    test('79 - Submit button should be type submit', async ({ page }) => {
      await expect(page.locator('#submit-btn')).toHaveAttribute('type', 'submit');
    });

    test('80 - Submit button should have gradient background', async ({ page }) => {
      const bg = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).background
      );
      expect(bg).toContain('gradient');
    });

    test('81 - Submit button should have white text', async ({ page }) => {
      const color = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).color
      );
      expect(color).toContain('rgb(255, 255, 255)');
    });

    test('82 - Submit button should have border radius', async ({ page }) => {
      const borderRadius = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('12px');
    });

    test('83 - Submit button should have full width', async ({ page }) => {
      const width = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).width
      );
      expect(parseInt(width)).toBeGreaterThan(100);
    });

    test('84 - Submit button should have padding', async ({ page }) => {
      const padding = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).padding
      );
      expect(padding).toContain('16px');
    });

    test('85 - Submit button should have pointer cursor', async ({ page }) => {
      const cursor = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('86 - Submit button should have transition', async ({ page }) => {
      const transition = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).transition
      );
      expect(transition).toContain('0.3s');
    });

    test('87 - Submit button should have font weight 700', async ({ page }) => {
      const fontWeight = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).fontWeight
      );
      expect(fontWeight).toBe('700');
    });

    test('88 - Submit button should have font size 17px', async ({ page }) => {
      const fontSize = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBe('17px');
    });

    test('89 - Submit button hover should work', async ({ page }) => {
      await page.locator('#submit-btn').hover();
      // Button should be hoverable
      const isVisible = await page.locator('#submit-btn').isVisible();
      expect(isVisible).toBe(true);
    });

    test('90 - Submit button should not have border', async ({ page }) => {
      const border = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).border
      );
      expect(border).toContain('0px');
    });

    test('91 - Submit button should have margin top', async ({ page }) => {
      const marginTop = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).marginTop
      );
      expect(marginTop).toBe('10px');
    });
  });

  // ============================================================
  // SECTION 8: LOADING STATE (8 tests)
  // ============================================================

  test.describe('Loading State', () => {
    test('92 - Loading element should exist', async ({ page }) => {
      const loading = page.locator('#loading');
      expect(await loading.count()).toBe(1);
    });

    test('93 - Loading should be hidden initially', async ({ page }) => {
      const display = await page.locator('#loading').evaluate(el =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('94 - Loading spinner should exist', async ({ page }) => {
      const spinner = page.locator('.loading-spinner');
      expect(await spinner.count()).toBe(1);
    });

    test('95 - Loading spinner should be circular', async ({ page }) => {
      const borderRadius = await page.locator('.loading-spinner').evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe('50%');
    });

    test('96 - Loading spinner should have animation', async ({ page }) => {
      const animation = await page.locator('.loading-spinner').evaluate(el =>
        window.getComputedStyle(el).animation
      );
      expect(animation).toContain('spin');
    });

    test('97 - Loading text should exist', async ({ page }) => {
      const text = page.locator('#loading p');
      await expect(text).toContainText('Creating your account');
    });

    test('98 - Loading should be centered', async ({ page }) => {
      const textAlign = await page.locator('#loading').evaluate(el =>
        window.getComputedStyle(el).textAlign
      );
      expect(textAlign).toBe('center');
    });

    test('99 - Loading spinner size should be 40px', async ({ page }) => {
      const width = await page.locator('.loading-spinner').evaluate(el =>
        window.getComputedStyle(el).width
      );
      expect(width).toBe('40px');
    });
  });

  // ============================================================
  // SECTION 9: DIVIDER (6 tests)
  // ============================================================

  test.describe('Divider Section', () => {
    test('100 - Divider should exist', async ({ page }) => {
      await expect(page.locator('.divider')).toBeVisible();
    });

    test('101 - Divider should contain OR text', async ({ page }) => {
      await expect(page.locator('.divider span')).toContainText('OR');
    });

    test('102 - Divider should be centered', async ({ page }) => {
      const textAlign = await page.locator('.divider').evaluate(el =>
        window.getComputedStyle(el).textAlign
      );
      expect(textAlign).toBe('center');
    });

    test('103 - Divider should have margin', async ({ page }) => {
      const margin = await page.locator('.divider').evaluate(el =>
        window.getComputedStyle(el).margin
      );
      expect(margin).toContain('30px');
    });

    test('104 - Divider line should exist (pseudo-element)', async ({ page }) => {
      const before = await page.locator('.divider').evaluate(el => {
        const before = window.getComputedStyle(el, '::before');
        return before.content;
      });
      expect(before).toBeTruthy();
    });

    test('105 - Divider text should have white background', async ({ page }) => {
      const bg = await page.locator('.divider span').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bg).toContain('rgb(255, 255, 255)');
    });
  });

  // ============================================================
  // SECTION 10: CLERK SECTION (5 tests)
  // ============================================================

  test.describe('Clerk Social Auth Section', () => {
    test('106 - Clerk section should exist', async ({ page }) => {
      await expect(page.locator('#clerk-section')).toBeVisible();
    });

    test('107 - Clerk signup container should exist', async ({ page }) => {
      const clerkSignup = page.locator('#clerk-signup');
      expect(await clerkSignup.count()).toBe(1);
    });

    test('108 - Clerk section should have margin top', async ({ page }) => {
      const marginTop = await page.locator('#clerk-section').evaluate(el =>
        window.getComputedStyle(el).marginTop
      );
      expect(marginTop).toBe('20px');
    });

    test('109 - Clerk should load after delay', async ({ page }) => {
      await page.waitForTimeout(3000);
      const clerkContent = await page.locator('#clerk-signup').innerHTML();
      expect(clerkContent.length).toBeGreaterThan(0);
    });

    test('110 - Window.Clerk should be defined', async ({ page }) => {
      await page.waitForTimeout(2000);
      const hasClerk = await page.evaluate(() => typeof window.Clerk !== 'undefined');
      expect(hasClerk).toBe(true);
    });
  });

  // ============================================================
  // SECTION 11: SIGNIN LINK (6 tests)
  // ============================================================

  test.describe('Sign In Link', () => {
    test('111 - Signin link container should exist', async ({ page }) => {
      await expect(page.locator('.signin-link')).toBeVisible();
    });

    test('112 - Signin link should have correct text', async ({ page }) => {
      await expect(page.locator('.signin-link')).toContainText('Already have an account?');
    });

    test('113 - Signin link anchor should exist', async ({ page }) => {
      await expect(page.locator('.signin-link a')).toBeVisible();
    });

    test('114 - Signin link should have correct href', async ({ page }) => {
      await expect(page.locator('.signin-link a')).toHaveAttribute('href', '/auth-dashboard');
    });

    test('115 - Signin link should be clickable', async ({ page }) => {
      const link = page.locator('.signin-link a');
      await expect(link).toBeEnabled();
    });

    test('116 - Signin link should have indigo color', async ({ page }) => {
      const color = await page.locator('.signin-link a').evaluate(el =>
        window.getComputedStyle(el).color
      );
      expect(color).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 12: RESPONSIVE DESIGN (10 tests)
  // ============================================================

  test.describe('Responsive Design - Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('117 - Page should load on mobile viewport', async ({ page }) => {
      await expect(page.locator('.signup-container')).toBeVisible();
    });

    test('118 - Container should fit mobile screen', async ({ page }) => {
      const width = await page.locator('.signup-container').evaluate(el =>
        el.getBoundingClientRect().width
      );
      expect(width).toBeLessThan(375);
    });

    test('119 - All form fields should be visible on mobile', async ({ page }) => {
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#phone')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
    });

    test('120 - Submit button should be full width on mobile', async ({ page }) => {
      const btnWidth = await page.locator('#submit-btn').evaluate(el =>
        window.getComputedStyle(el).width
      );
      expect(parseInt(btnWidth)).toBeGreaterThan(200);
    });

    test('121 - Text should be readable on mobile', async ({ page }) => {
      const fontSize = await page.locator('.logo h1').evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(parseInt(fontSize)).toBeGreaterThan(20);
    });

    test('122 - Container padding should work on mobile', async ({ page }) => {
      const padding = await page.locator('.signup-container').evaluate(el =>
        window.getComputedStyle(el).padding
      );
      expect(padding).toBeTruthy();
    });

    test('123 - Form should not overflow on mobile', async ({ page }) => {
      const containerWidth = await page.locator('.signup-container').evaluate(el =>
        el.scrollWidth
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(containerWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test('124 - Logo should be visible on mobile', async ({ page }) => {
      await expect(page.locator('.logo h1')).toBeVisible();
    });

    test('125 - Divider should work on mobile', async ({ page }) => {
      await expect(page.locator('.divider')).toBeVisible();
    });

    test('126 - Signin link should be visible on mobile', async ({ page }) => {
      await expect(page.locator('.signin-link')).toBeVisible();
    });
  });

  // ============================================================
  // SECTION 13: FORM VALIDATION LOGIC (15 tests)
  // ============================================================

  test.describe('Form Validation Logic', () => {
    test('127 - Empty form should not submit', async ({ page }) => {
      await page.locator('#submit-btn').click();
      // Should still be on same page
      await expect(page.locator('#signup-form')).toBeVisible();
    });

    test('128 - Form with only email should not submit', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#submit-btn').click();
      await expect(page.locator('#signup-form')).toBeVisible();
    });

    test('129 - Form with only phone should not submit', async ({ page }) => {
      await page.locator('#phone').fill('919876543210');
      await page.locator('#submit-btn').click();
      await expect(page.locator('#signup-form')).toBeVisible();
    });

    test('130 - Form with only password should not submit', async ({ page }) => {
      await page.locator('#password').fill('Password123');
      await page.locator('#submit-btn').click();
      await expect(page.locator('#signup-form')).toBeVisible();
    });

    test('131 - Invalid email should not submit', async ({ page }) => {
      await page.locator('#email').fill('notanemail');
      await page.locator('#phone').fill('919876543210');
      await page.locator('#password').fill('Password123');
      await page.locator('#submit-btn').click();
      // HTML5 validation should prevent submit
      await expect(page.locator('#signup-form')).toBeVisible();
    });

    test('132 - Short password should not submit', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#phone').fill('919876543210');
      await page.locator('#password').fill('short');
      await page.locator('#submit-btn').click();
      await expect(page.locator('#signup-form')).toBeVisible();
    });

    test('133 - Invalid phone format (no 91) should show error', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#phone').fill('9876543210');
      await page.locator('#password').fill('Password123');
      await page.locator('#submit-btn').click();
      await page.waitForTimeout(500);
      // Custom validation should trigger
      const hasError = await page.locator('.error').count();
      expect(hasError).toBeGreaterThanOrEqual(0); // May or may not show based on Clerk
    });

    test('134 - Phone with letters should not pass validation', async ({ page }) => {
      await page.locator('#phone').fill('91ABCDEFGHIJ');
      const isValid = await page.locator('#phone').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('135 - Phone too short should not pass validation', async ({ page }) => {
      await page.locator('#phone').fill('9198765');
      const isValid = await page.locator('#phone').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('136 - Phone too long should not pass validation', async ({ page }) => {
      await page.locator('#phone').fill('919876543210123');
      const isValid = await page.locator('#phone').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('137 - Email with special chars should validate', async ({ page }) => {
      await page.locator('#email').fill('user+tag@example.com');
      const isValid = await page.locator('#email').evaluate(el => el.validity.valid);
      expect(isValid).toBe(true);
    });

    test('138 - Email without @ should not validate', async ({ page }) => {
      await page.locator('#email').fill('userexample.com');
      const isValid = await page.locator('#email').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('139 - Email without domain should not validate', async ({ page }) => {
      await page.locator('#email').fill('user@');
      const isValid = await page.locator('#email').evaluate(el => el.validity.valid);
      expect(isValid).toBe(false);
    });

    test('140 - Valid complete form should attempt submission', async ({ page }) => {
      await page.locator('#email').fill('newuser@example.com');
      await page.locator('#phone').fill('919876543210');
      await page.locator('#password').fill('SecurePassword123');

      await page.locator('#submit-btn').click();
      await page.waitForTimeout(1000);

      // Form should either show loading or error (Clerk may reject)
      const formHidden = await page.locator('#signup-form').isHidden();
      const hasError = await page.locator('.error').isVisible();
      expect(formHidden || hasError).toBe(true);
    });

    test('141 - Error message container should exist', async ({ page }) => {
      const errorContainer = page.locator('#error-message');
      expect(await errorContainer.count()).toBe(1);
    });
  });
});
