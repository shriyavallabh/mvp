/**
 * Automated Supabase Project Creation via Playwright
 *
 * This script automates the entire Supabase project creation process:
 * 1. Opens browser to Supabase dashboard
 * 2. Creates new project with specified settings
 * 3. Waits for provisioning to complete
 * 4. Extracts all credentials
 * 5. Saves to .env file automatically
 *
 * Usage:
 *   SUPABASE_EMAIL=your@email.com SUPABASE_PASSWORD=yourpass node scripts/create-supabase-project.js
 *
 * Or for interactive mode (browser visible):
 *   HEADLESS=false node scripts/create-supabase-project.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function createSupabaseProject() {
  console.log('🚀 Starting Supabase Project Creation Automation\n');

  // Configuration
  const config = {
    projectName: 'JarvisDaily',
    region: 'ap-south-1', // Mumbai
    plan: 'free',
    organizationName: "shriyavallabh.ap@gmail.com's Org",
    headless: process.env.HEADLESS !== 'false', // Set HEADLESS=false to watch
  };

  console.log('📋 Configuration:');
  console.log(`   Project Name: ${config.projectName}`);
  console.log(`   Region: ${config.region} (Mumbai)`);
  console.log(`   Mode: ${config.headless ? 'Headless' : 'Visible Browser'}\n`);

  // Launch browser
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.headless ? 0 : 500, // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to Supabase Dashboard
    console.log('🌐 Step 1: Navigating to Supabase Dashboard...');
    await page.goto('https://supabase.com/dashboard', { waitUntil: 'networkidle' });

    // Check if already logged in
    const isLoggedIn = await page.locator('text=New project').isVisible({ timeout: 5000 }).catch(() => false);

    if (!isLoggedIn) {
      console.log('🔐 Not logged in - Please log in manually...');
      console.log('   Waiting for you to log in (you have 2 minutes)...\n');

      // Wait for user to log in manually
      await page.waitForURL('**/dashboard**', { timeout: 120000 });
      console.log('✅ Login detected!\n');
    } else {
      console.log('✅ Already logged in!\n');
    }

    // Wait for dashboard to fully load
    await page.waitForSelector('text=New project', { timeout: 30000 });

    // Step 2: Click "New project" button
    console.log('🆕 Step 2: Creating new project...');
    await page.click('button:has-text("New project"), a:has-text("New project")');

    // Wait for modal
    await page.waitForSelector('text=Create a new project', { timeout: 10000 });

    // Step 3: Fill in project details
    console.log('📝 Step 3: Filling project details...');

    // Select organization (if dropdown exists)
    const orgDropdown = page.locator('select, [role="combobox"]').first();
    if (await orgDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await orgDropdown.selectOption({ label: config.organizationName });
      console.log(`   ✓ Selected organization: ${config.organizationName}`);
    }

    // Project name
    await page.fill('input[name="name"], input[placeholder*="project" i]', config.projectName);
    console.log(`   ✓ Project name: ${config.projectName}`);

    // Generate strong password
    const dbPassword = `JD2025_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    await page.fill('input[type="password"], input[name="password"]', dbPassword);
    console.log(`   ✓ Database password: ${dbPassword}`);

    // Select region
    const regionSelector = page.locator('select[name="region"], [data-testid="region-select"]');
    if (await regionSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await regionSelector.selectOption({ value: config.region });
      console.log(`   ✓ Region: ${config.region} (Mumbai)`);
    }

    // Select free plan (if visible)
    const freePlanButton = page.locator('button:has-text("Free"), [data-plan="free"]');
    if (await freePlanButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await freePlanButton.click();
      console.log('   ✓ Plan: Free');
    }

    // Step 4: Submit form
    console.log('\n🚀 Step 4: Creating project (this takes 2-3 minutes)...');
    await page.click('button:has-text("Create new project")');

    // Wait for provisioning
    console.log('⏳ Waiting for project to provision...');

    // Wait for either success message or project settings to be available
    await Promise.race([
      page.waitForSelector('text=Project is ready', { timeout: 300000 }),
      page.waitForURL('**/project/**/settings', { timeout: 300000 }),
      page.waitForSelector('[data-state="success"]', { timeout: 300000 }),
    ]);

    console.log('✅ Project created successfully!\n');

    // Step 5: Navigate to API settings
    console.log('🔑 Step 5: Extracting credentials...');

    // If not already on settings page, navigate there
    const currentUrl = page.url();
    if (!currentUrl.includes('/settings')) {
      await page.click('[href*="/settings"], button:has-text("Settings")');
      await page.waitForTimeout(1000);
    }

    // Click API in sidebar
    await page.click('[href*="/settings/api"], text=API');
    await page.waitForURL('**/settings/api**', { timeout: 10000 });

    // Wait for API keys to load
    await page.waitForSelector('text=Project URL', { timeout: 10000 });

    // Extract Project URL
    const projectUrl = await page.locator('text=Project URL')
      .locator('..')
      .locator('code, input, [data-code]')
      .first()
      .textContent();

    console.log(`   ✓ Project URL: ${projectUrl}`);

    // Extract anon key
    const anonKey = await page.locator('text=anon')
      .locator('..')
      .locator('code, input, [data-code]')
      .first()
      .textContent();

    console.log(`   ✓ Anon key: ${anonKey.substring(0, 40)}...`);

    // Extract service_role key (need to reveal it first)
    console.log('   🔓 Revealing service_role key...');
    const revealButton = page.locator('text=service_role')
      .locator('..')
      .locator('button:has-text("Reveal"), button:has-text("Show")');

    if (await revealButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await revealButton.click();
      await page.waitForTimeout(500);
    }

    const serviceRoleKey = await page.locator('text=service_role')
      .locator('..')
      .locator('code, input, [data-code]')
      .first()
      .textContent();

    console.log(`   ✓ Service role key: ${serviceRoleKey.substring(0, 40)}...`);

    // Step 6: Save to .env file
    console.log('\n💾 Step 6: Updating .env file...');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Update credentials
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      `NEXT_PUBLIC_SUPABASE_URL=${projectUrl}`
    );

    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`
    );

    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log('   ✓ .env file updated!');

    // Also update .env.local if it exists
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envLocalPath)) {
      let envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');
      envLocalContent = envLocalContent.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.*/,
        `NEXT_PUBLIC_SUPABASE_URL=${projectUrl}`
      );
      envLocalContent = envLocalContent.replace(
        /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`
      );
      fs.writeFileSync(envLocalPath, envLocalContent);
      console.log('   ✓ .env.local file updated!');
    }

    // Save credentials to a separate file for reference
    const credentialsPath = path.join(__dirname, '..', 'supabase-credentials.txt');
    const credentialsContent = `
SUPABASE PROJECT CREATED SUCCESSFULLY
Generated: ${new Date().toISOString()}

Project Name: ${config.projectName}
Database Password: ${dbPassword}
Region: Mumbai (ap-south-1)

CREDENTIALS:
Project URL: ${projectUrl}
Anon Key: ${anonKey}
Service Role Key: ${serviceRoleKey}

⚠️  IMPORTANT: Keep the database password safe!
⚠️  The service_role key has full database access - keep it secret!
`;

    fs.writeFileSync(credentialsPath, credentialsContent);
    console.log(`   ✓ Credentials saved to: supabase-credentials.txt\n`);

    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Supabase Project Ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📦 Project: ${config.projectName}`);
    console.log(`🌍 Region: Mumbai`);
    console.log(`🔗 URL: ${projectUrl}`);
    console.log(`🔑 Database Password: ${dbPassword}`);
    console.log('\n✅ .env file updated automatically');
    console.log('✅ Ready for schema execution\n');

    return {
      success: true,
      projectUrl,
      anonKey,
      serviceRoleKey,
      dbPassword,
    };

  } catch (error) {
    console.error('\n❌ Error during automation:', error.message);
    console.error('\nStack trace:', error.stack);

    // Take screenshot for debugging
    const screenshotPath = path.join(__dirname, '..', 'error-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`\n📸 Screenshot saved to: error-screenshot.png`);

    throw error;

  } finally {
    // Keep browser open if in visible mode for user to verify
    if (!config.headless) {
      console.log('\n👀 Browser will stay open for 30 seconds for you to verify...');
      await page.waitForTimeout(30000);
    }

    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  createSupabaseProject()
    .then((result) => {
      console.log('\n✨ Automation completed successfully!');
      console.log('\nNext step: Run schema execution:');
      console.log('   node scripts/execute-schema-now.js\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Automation failed:', error.message);
      console.log('\n📋 Fallback: Create project manually and paste credentials\n');
      process.exit(1);
    });
}

module.exports = { createSupabaseProject };
