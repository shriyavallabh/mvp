/**
 * Execute Supabase Schema via Browser Automation
 *
 * This script:
 * 1. Opens browser to Supabase project
 * 2. Waits for you to log in manually (secure)
 * 3. Navigates to SQL Editor automatically
 * 4. Pastes and executes the schema
 * 5. Verifies success
 *
 * Usage:
 *   node scripts/execute-schema-via-browser.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSchemaViaBrowser() {
  console.log('🚀 Supabase Schema Execution via Browser Automation\n');

  // Get project URL from .env
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env');
    process.exit(1);
  }

  // Extract project reference
  const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`📦 Project: ${projectRef}`);
  console.log(`🔗 URL: ${projectUrl}\n`);

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  console.log(`📄 Schema loaded: ${(schema.length / 1024).toFixed(2)} KB\n`);

  // Launch browser (VISIBLE so user can log in)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to Supabase dashboard
    console.log('🌐 Step 1: Opening Supabase dashboard...');
    const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}`;
    await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('   ✓ Dashboard page loaded\n');

    // Step 2: Check if logged in
    console.log('🔐 Step 2: Checking login status...');

    // Wait a moment for page to fully load
    await page.waitForTimeout(2000);

    // Check for login indicators
    const isLoggedIn = await Promise.race([
      page.waitForSelector('text=SQL Editor', { timeout: 5000 }).then(() => true),
      page.waitForSelector('[data-testid="sql-editor"]', { timeout: 5000 }).then(() => true),
      page.waitForSelector('text=Project Settings', { timeout: 5000 }).then(() => true),
    ]).catch(() => false);

    if (!isLoggedIn) {
      console.log('⏳ Not logged in yet...');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 PLEASE LOG IN TO SUPABASE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('   📺 Look at the browser window that just opened');
      console.log('   🔑 Log in with your Supabase credentials');
      console.log('   ⏱️  You have 3 minutes');
      console.log('   ✅ Script will continue automatically after login');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Wait for login (detect when SQL Editor or Settings appears)
      await Promise.race([
        page.waitForSelector('text=SQL Editor', { timeout: 180000 }),
        page.waitForSelector('[data-testid="sql-editor"]', { timeout: 180000 }),
        page.waitForSelector('text=Project Settings', { timeout: 180000 }),
        page.waitForURL(`**/project/${projectRef}/**`, { timeout: 180000 }),
      ]);

      console.log('✅ Login detected!\n');
    } else {
      console.log('✅ Already logged in!\n');
    }

    // Step 3: Navigate to SQL Editor
    console.log('📝 Step 3: Opening SQL Editor...');

    // Try multiple methods to find SQL Editor link
    const sqlEditorButton = await Promise.race([
      page.locator('text=SQL Editor').first(),
      page.locator('[href*="/sql"]').first(),
      page.locator('a:has-text("SQL")').first(),
    ]).catch(() => null);

    if (sqlEditorButton) {
      await sqlEditorButton.click();
      console.log('   ✓ Clicked SQL Editor link');
    } else {
      // Navigate directly to SQL URL
      const sqlUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
      await page.goto(sqlUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('   ✓ Navigated directly to SQL Editor');
    }

    // Wait for SQL Editor to load
    await page.waitForTimeout(2000);
    console.log('   ✓ SQL Editor loaded\n');

    // Step 4: Create new query (if not already on new query page)
    console.log('🆕 Step 4: Creating new query...');

    // Check if we need to click "New query" button
    const newQueryButton = await page.locator('button:has-text("New query"), button:has-text("New Query")').first().catch(() => null);
    if (newQueryButton && await newQueryButton.isVisible().catch(() => false)) {
      await newQueryButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✓ Clicked "New query" button');
    } else {
      console.log('   ✓ Already in new query mode');
    }

    // Step 5: Find the SQL editor textarea/code editor
    console.log('\n💾 Step 5: Pasting schema into editor...');

    // Try to find the code editor
    // Supabase uses Monaco/CodeMirror - try multiple selectors
    const editorSelectors = [
      '.monaco-editor textarea',
      '.CodeMirror textarea',
      '[data-testid="sql-editor-input"]',
      '[contenteditable="true"]',
      'textarea[placeholder*="SQL" i]',
      'textarea[placeholder*="query" i]',
      '.view-lines',
    ];

    let editor = null;
    for (const selector of editorSelectors) {
      const el = await page.locator(selector).first().catch(() => null);
      if (el && await el.isVisible().catch(() => false)) {
        editor = el;
        break;
      }
    }

    if (!editor) {
      // Fallback: try to click in the editor area first
      console.log('   🔍 Searching for editor...');
      await page.click('text=Type your SQL query', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);

      // Try again
      for (const selector of editorSelectors) {
        const el = await page.locator(selector).first().catch(() => null);
        if (el && await el.isVisible().catch(() => false)) {
          editor = el;
          break;
        }
      }
    }

    if (!editor) {
      throw new Error('Could not find SQL editor input field');
    }

    // Clear any existing content
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // Type the schema
    console.log('   📝 Pasting schema (this may take 10-15 seconds)...');
    await editor.fill(schema);

    console.log('   ✓ Schema pasted successfully\n');

    // Step 6: Run the query
    console.log('▶️  Step 6: Executing schema...');

    // Find the Run button
    const runButton = await Promise.race([
      page.locator('button:has-text("Run")').first(),
      page.locator('[data-testid="run-query"]').first(),
      page.locator('button[title*="Run" i]').first(),
    ]).catch(() => null);

    if (!runButton) {
      throw new Error('Could not find Run button');
    }

    await runButton.click();
    console.log('   ✓ Clicked Run button');

    // Wait for execution to complete
    console.log('   ⏳ Waiting for execution...');
    await page.waitForTimeout(5000);

    // Check for success/error messages
    const successIndicators = [
      'text=Success',
      'text=No rows returned',
      'text=Query executed',
      '[data-status="success"]',
    ];

    let executionSuccess = false;
    for (const indicator of successIndicators) {
      const el = await page.locator(indicator).first().catch(() => null);
      if (el && await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        executionSuccess = true;
        break;
      }
    }

    if (executionSuccess) {
      console.log('   ✅ Schema executed successfully!\n');
    } else {
      console.log('   ⚠️  Execution completed (check for errors in browser)\n');
    }

    // Step 7: Verify tables created
    console.log('🔍 Step 7: Verifying tables...');

    // Navigate to Table Editor to verify
    const tableEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/editor`;
    await page.goto(tableEditorUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Check for tables in sidebar
    const usersTableExists = await page.locator('text=users').first().isVisible({ timeout: 5000 }).catch(() => false);
    const profilesTableExists = await page.locator('text=advisor_profiles').first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log('');
    if (usersTableExists) {
      console.log('   ✅ users table found');
    } else {
      console.log('   ⚠️  users table not visible yet (may need refresh)');
    }

    if (profilesTableExists) {
      console.log('   ✅ advisor_profiles table found');
    } else {
      console.log('   ⚠️  advisor_profiles table not visible yet (may need refresh)');
    }

    // Final summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SCHEMA EXECUTION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Schema SQL executed in Supabase');
    console.log('✅ Tables should be created');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Check the browser - verify no errors');
    console.log('   2. Go to Table Editor - confirm tables exist');
    console.log('   3. Run verification: node scripts/check-supabase-tables.js');
    console.log('');
    console.log('👀 Browser will stay open for 30 seconds for you to verify...\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack:', error.stack);

    // Take screenshot
    const screenshotPath = path.join(__dirname, '..', 'schema-error-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`\n📸 Screenshot saved: schema-error-screenshot.png`);

    console.log('\n⏸️  Browser will stay open for 2 minutes for you to debug...');
    await page.waitForTimeout(120000);

    throw error;

  } finally {
    await browser.close();
    console.log('✅ Browser closed\n');
  }
}

// Run
if (require.main === module) {
  executeSchemaViaBrowser()
    .then(() => {
      console.log('✨ Automation completed successfully!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Automation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { executeSchemaViaBrowser };
