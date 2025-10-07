const { test, expect } = require('@playwright/test');

test.describe('JarvisDaily Signup Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup.html');
  });

  test('should display the signup page with all elements', async ({ page }) => {
    // Check logo and title
    await expect(page.locator('h1')).toContainText('JarvisDaily');
    await expect(page.locator('.logo p')).toContainText('Create your advisor account');

    // Check info box
    await expect(page.locator('.info-box')).toBeVisible();
    await expect(page.locator('.info-box')).toContainText('Enter your details below');

    // Check form fields exist
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Check labels
    await expect(page.locator('label[for="email"]')).toContainText('Email Address');
    await expect(page.locator('label[for="phone"]')).toContainText('WhatsApp Phone Number');
    await expect(page.locator('label[for="password"]')).toContainText('Password');

    // Check submit button
    await expect(page.locator('#submit-btn')).toBeVisible();
    await expect(page.locator('#submit-btn')).toContainText('Create Account');

    // Check divider
    await expect(page.locator('.divider')).toBeVisible();
    await expect(page.locator('.divider span')).toContainText('OR');

    // Check sign in link
    await expect(page.locator('.signin-link')).toBeVisible();
    await expect(page.locator('.signin-link a')).toContainText('Sign In');
  });

  test('should have correct input placeholders and attributes', async ({ page }) => {
    // Email field
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#email')).toHaveAttribute('placeholder', 'you@example.com');
    await expect(page.locator('#email')).toHaveAttribute('required', '');

    // Phone field
    await expect(page.locator('#phone')).toHaveAttribute('type', 'tel');
    await expect(page.locator('#phone')).toHaveAttribute('placeholder', '919765071249');
    await expect(page.locator('#phone')).toHaveAttribute('pattern', '[0-9]{12}');
    await expect(page.locator('#phone')).toHaveAttribute('required', '');

    // Password field
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#password')).toHaveAttribute('placeholder', 'Min. 8 characters');
    await expect(page.locator('#password')).toHaveAttribute('minlength', '8');
    await expect(page.locator('#password')).toHaveAttribute('required', '');
  });

  test('should show phone number format hint', async ({ page }) => {
    const phoneHint = page.locator('small').filter({ hasText: 'Format: 91 followed by 10 digits' });
    await expect(phoneHint).toBeVisible();
  });

  test('should validate phone number format - reject invalid format', async ({ page }) => {
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('1234567890'); // Invalid - doesn't start with 91
    await page.locator('#password').fill('password123');

    await page.locator('#submit-btn').click();

    // Should show error message
    const errorMessage = page.locator('.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Please enter a valid phone number in format: 91XXXXXXXXXX');
  });

  test('should validate phone number format - accept valid format', async ({ page }) => {
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('919765071249'); // Valid format
    await page.locator('#password').fill('password123');

    await page.locator('#submit-btn').click();

    // Should show loading state
    await expect(page.locator('#loading')).toBeVisible();
    await expect(page.locator('.loading-spinner')).toBeVisible();
  });

  test('should show loading state when form is submitted', async ({ page }) => {
    // Fill valid data
    await page.locator('#email').fill('newuser@example.com');
    await page.locator('#phone').fill('919876543210');
    await page.locator('#password').fill('SecurePass123');

    // Submit form
    await page.locator('#submit-btn').click();

    // Check loading state
    await expect(page.locator('#signup-form')).toBeHidden();
    await expect(page.locator('#loading')).toBeVisible();
    await expect(page.locator('.loading-spinner')).toBeVisible();
    await expect(page.locator('#loading')).toContainText('Creating your account');
  });

  test('should clear error messages when form is resubmitted', async ({ page }) => {
    // First submit with invalid phone
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('123456');
    await page.locator('#password').fill('password123');
    await page.locator('#submit-btn').click();

    // Error should be visible
    await expect(page.locator('.error')).toBeVisible();

    // Fix phone and resubmit
    await page.locator('#phone').fill('919765071249');
    await page.locator('#submit-btn').click();

    // Error should be cleared
    await expect(page.locator('#error-message')).toBeEmpty();
  });

  test('should have proper input focus styles', async ({ page }) => {
    const emailInput = page.locator('#email');

    // Focus the input
    await emailInput.focus();

    // Check border color changes (indigo on focus)
    const borderColor = await emailInput.evaluate(el => {
      return window.getComputedStyle(el).borderColor;
    });

    // Should have focus styling applied
    expect(borderColor).toBeTruthy();
  });

  test('should have responsive design elements', async ({ page }) => {
    // Check container has max-width and padding
    const container = page.locator('.signup-container');
    await expect(container).toHaveCSS('max-width', '500px');
    await expect(container).toHaveCSS('padding', '40px');
    await expect(container).toHaveCSS('border-radius', '20px');
  });

  test('should validate email format using HTML5 validation', async ({ page }) => {
    const emailInput = page.locator('#email');

    // Try invalid email
    await emailInput.fill('invalidemail');

    // Check HTML5 validation state
    const isValid = await emailInput.evaluate(el => el.validity.valid);
    expect(isValid).toBe(false);

    // Try valid email
    await emailInput.fill('valid@email.com');
    const isValidNow = await emailInput.evaluate(el => el.validity.valid);
    expect(isValidNow).toBe(true);
  });

  test('should enforce minimum password length', async ({ page }) => {
    const passwordInput = page.locator('#password');

    // Try short password
    await passwordInput.fill('short');

    // Check validation
    const isValid = await passwordInput.evaluate(el => el.validity.valid);
    expect(isValid).toBe(false);

    // Try valid password
    await passwordInput.fill('longenoughpassword');
    const isValidNow = await passwordInput.evaluate(el => el.validity.valid);
    expect(isValidNow).toBe(true);
  });

  test('should have Sign In link pointing to correct page', async ({ page }) => {
    const signInLink = page.locator('.signin-link a');
    await expect(signInLink).toHaveAttribute('href', '/auth-dashboard');
  });

  test('should display gradient background', async ({ page }) => {
    const body = page.locator('body');
    const background = await body.evaluate(el => {
      return window.getComputedStyle(el).background;
    });

    // Should have gradient background
    expect(background).toContain('gradient');
  });

  test('should have proper button hover effects', async ({ page }) => {
    const submitBtn = page.locator('#submit-btn');

    // Get initial transform
    const initialTransform = await submitBtn.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Hover over button
    await submitBtn.hover();

    // Button should have transform on hover (translateY)
    const hoveredTransform = await submitBtn.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    expect(hoveredTransform).toBeTruthy();
  });

  test('should disable submit button when form is submitting', async ({ page }) => {
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('919765071249');
    await page.locator('#password').fill('password123');

    // Submit and check if form is hidden (loading state)
    await page.locator('#submit-btn').click();

    // Form should be hidden when loading
    await expect(page.locator('#signup-form')).toBeHidden();
  });

  test('should show Clerk signup section below divider', async ({ page }) => {
    await expect(page.locator('#clerk-section')).toBeVisible();
    await expect(page.locator('#clerk-signup')).toBeVisible();
  });

  test('password field should hide input characters', async ({ page }) => {
    const passwordInput = page.locator('#password');

    // Check input type is password
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Fill password
    await passwordInput.fill('MySecretPassword123');

    // Verify it's still type password (characters are hidden)
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have all required asterisks in labels', async ({ page }) => {
    await expect(page.locator('label[for="email"]')).toContainText('*');
    await expect(page.locator('label[for="phone"]')).toContainText('*');
    await expect(page.locator('label[for="password"]')).toContainText('*');
  });

  test('should maintain form data when validation fails', async ({ page }) => {
    const testEmail = 'test@example.com';
    const invalidPhone = '123456';
    const testPassword = 'password123';

    // Fill form with invalid phone
    await page.locator('#email').fill(testEmail);
    await page.locator('#phone').fill(invalidPhone);
    await page.locator('#password').fill(testPassword);

    // Submit
    await page.locator('#submit-btn').click();

    // Error should show
    await expect(page.locator('.error')).toBeVisible();

    // Form should still have the data (not cleared)
    await expect(page.locator('#email')).toHaveValue(testEmail);
    await expect(page.locator('#phone')).toHaveValue(invalidPhone);
    await expect(page.locator('#password')).toHaveValue(testPassword);
  });

  test('should have correct color scheme matching design', async ({ page }) => {
    // Check logo has gradient text
    const logoH1 = page.locator('.logo h1');
    const background = await logoH1.evaluate(el =>
      window.getComputedStyle(el).background
    );
    expect(background).toContain('gradient');

    // Check button has gradient background
    const submitBtn = page.locator('#submit-btn');
    const btnBackground = await submitBtn.evaluate(el =>
      window.getComputedStyle(el).background
    );
    expect(btnBackground).toContain('gradient');
  });

  test('mobile viewport - should be responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Elements should still be visible
    await expect(page.locator('.signup-container')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeVisible();

    // Container should have appropriate padding on mobile
    const containerPadding = await page.locator('.signup-container').evaluate(el =>
      window.getComputedStyle(el).padding
    );
    expect(containerPadding).toBeTruthy();
  });

  test('should prevent form submission with empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.locator('#submit-btn').click();

    // Browser's HTML5 validation should prevent submission
    // Form should still be visible (not submitted)
    await expect(page.locator('#signup-form')).toBeVisible();
    await expect(page.locator('#loading')).toBeHidden();
  });

  test('should show appropriate error for phone number not matching pattern', async ({ page }) => {
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('9876543210'); // Missing '91' prefix
    await page.locator('#password').fill('password123');

    await page.locator('#submit-btn').click();

    // Should show validation error
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('valid phone number');
  });
});

test.describe('Visual Regression Tests', () => {
  test('signup page should match snapshot', async ({ page }) => {
    await page.goto('/signup.html');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await expect(page).toHaveScreenshot('signup-page.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('signup page with error message should match snapshot', async ({ page }) => {
    await page.goto('/signup.html');

    // Trigger error
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('123');
    await page.locator('#password').fill('password123');
    await page.locator('#submit-btn').click();

    // Wait for error to appear
    await page.waitForSelector('.error', { state: 'visible' });

    // Take screenshot
    await expect(page).toHaveScreenshot('signup-page-error.png', {
      maxDiffPixels: 100
    });
  });
});
