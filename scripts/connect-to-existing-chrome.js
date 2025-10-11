/**
 * Connect Playwright to Existing Chrome Browser
 *
 * This script connects Playwright to YOUR existing Chrome browser,
 * so it can use your logged-in sessions!
 *
 * Steps:
 * 1. Launch Chrome with remote debugging
 * 2. Playwright connects to that Chrome
 * 3. Automates tasks using YOUR browser (with your login!)
 *
 * Usage:
 *   node scripts/connect-to-existing-chrome.js
 */

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function connectToExistingChrome() {
  console.log('🚀 Connecting to Existing Chrome Browser\n');

  // Step 1: Launch Chrome with remote debugging
  console.log('📱 Step 1: Launching Chrome with remote debugging...');
  console.log('   (This will open a NEW Chrome window)');
  console.log('   ⚠️  Log in to Supabase in this window!\n');

  const debugPort = 9222;
  const userDataDir = path.join(__dirname, '..', '.chrome-debug-profile');

  // Ensure user data directory exists
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Launch Chrome with remote debugging
  // Using open command on macOS
  const chromeCommand = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${debugPort} --user-data-dir="${userDataDir}" "https://supabase.com/dashboard/project/dmgdbzcbxagloqwylxwv" > /dev/null 2>&1 &`;

  try {
    execSync(chromeCommand, { shell: '/bin/bash' });
    console.log(`✅ Chrome launched with debugging on port ${debugPort}`);
  } catch (error) {
    console.log('⚠️  Chrome may already be running');
  }

  // Wait for Chrome to start
  console.log('⏳ Waiting 5 seconds for Chrome to start...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Get CDP endpoint
  console.log('🔗 Step 2: Getting Chrome DevTools endpoint...');

  let wsEndpoint;
  try {
    const response = await fetch(`http://localhost:${debugPort}/json/version`);
    const data = await response.json();
    wsEndpoint = data.webSocketDebuggerUrl;
    console.log(`✅ Connected to Chrome: ${wsEndpoint.substring(0, 50)}...\n`);
  } catch (error) {
    console.error('❌ Could not connect to Chrome debugging port');
    console.error('   Make sure Chrome is running with --remote-debugging-port=9222');
    process.exit(1);
  }

  // Step 3: Connect Playwright to Chrome
  console.log('🎭 Step 3: Connecting Playwright to your Chrome...');
  const browser = await chromium.connectOverCDP(wsEndpoint);
  const contexts = browser.contexts();
  const page = contexts[0].pages()[0] || await contexts[0].newPage();

  console.log('✅ Playwright connected to your Chrome!\n');

  // Step 4: Wait for user to log in
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 PLEASE LOG IN TO SUPABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('   📺 Look at the Chrome window that opened');
  console.log('   🔑 Log in with your Supabase credentials');
  console.log('   ⏱️  You have 3 minutes');
  console.log('   ✅ Press Enter here when you are logged in');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Wait for user confirmation
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });

  console.log('✅ Login confirmed! Proceeding with automation...\n');

  try {
    // Step 5: Navigate to SQL Editor
    console.log('📝 Step 5: Navigating to SQL Editor...');

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    const sqlUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

    await page.goto(sqlUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log('   ✓ SQL Editor loaded\n');

    // Step 6: Find and fill the editor
    console.log('💾 Step 6: Pasting schema...');

    // Read schema
    const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Try to find the editor
    const editorSelectors = [
      '.monaco-editor textarea',
      '.CodeMirror textarea',
      '[contenteditable="true"]',
      'textarea',
    ];

    let editor = null;
    for (const selector of editorSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          editor = el;
          break;
        }
      } catch {}
    }

    if (!editor) {
      console.log('⚠️  Could not find editor automatically');
      console.log('   Trying to click in editor area...');

      // Try clicking in the page to activate editor
      await page.click('body');
      await page.waitForTimeout(1000);

      // Try again
      for (const selector of editorSelectors) {
        try {
          const el = page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            editor = el;
            break;
          }
        } catch {}
      }
    }

    if (editor) {
      // Clear and paste
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await editor.fill(schema);
      console.log('   ✓ Schema pasted\n');
    } else {
      console.log('⚠️  Could not find editor - trying keyboard shortcut');
      await page.keyboard.press('Control+A');
      await page.keyboard.type(schema);
      console.log('   ✓ Schema typed via keyboard\n');
    }

    // Step 7: Run the query
    console.log('▶️  Step 7: Clicking Run button...');

    const runButton = await page.locator('button:has-text("Run")').first();
    await runButton.click();
    console.log('   ✓ Clicked Run\n');

    // Wait for execution
    console.log('⏳ Waiting for execution (10 seconds)...');
    await page.waitForTimeout(10000);

    // Check for success
    const success = await page.locator('text=Success').first().isVisible({ timeout: 5000 }).catch(() => false);

    if (success) {
      console.log('✅ Schema executed successfully!\n');
    } else {
      console.log('⚠️  Execution completed (check browser for any errors)\n');
    }

    // Step 8: Verify tables
    console.log('🔍 Step 8: Verifying tables...');
    const tableEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/editor`;
    await page.goto(tableEditorUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const usersTable = await page.locator('text=users').first().isVisible({ timeout: 5000 }).catch(() => false);
    const profilesTable = await page.locator('text=advisor_profiles').first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log('');
    console.log(usersTable ? '   ✅ users table found' : '   ⚠️  users table not visible');
    console.log(profilesTable ? '   ✅ advisor_profiles table found' : '   ⚠️  advisor_profiles table not visible');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 AUTOMATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Chrome window will stay open for you to verify.\n');
    console.log('Press Ctrl+C to exit when done.\n');

    // Keep process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);

    const screenshotPath = path.join(__dirname, '..', 'chrome-automation-error.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`\n📸 Screenshot saved: chrome-automation-error.png\n`);
  }
}

// Run
if (require.main === module) {
  connectToExistingChrome()
    .catch((error) => {
      console.error('💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { connectToExistingChrome };
