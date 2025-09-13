// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// Load environment variables
require('dotenv').config();

const BASE_URL = process.env.NGROK_URL || 'http://143.110.191.97:5001';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://143.110.191.97:3000';

/**
 * Playwright Configuration for Comprehensive E2E Testing
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  outputDir: './tests/e2e/playwright/test-results',
  
  /* Maximum time one test can run */
  timeout: 60 * 1000,
  
  /* Global test timeout */
  globalTimeout: 60 * 60 * 1000, // 1 hour for all tests
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry failed tests */
  retries: process.env.CI ? 2 : 1,
  
  /* Number of parallel workers */
  workers: process.env.CI ? 2 : 4,
  
  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'tests/reports/playwright-report' }],
    ['json', { outputFile: 'tests/reports/test-results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Action timeout */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for different test suites */
  projects: [
    {
      name: 'monitoring',
      testDir: './tests/monitoring',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: DASHBOARD_URL
      },
    },
    {
      name: 'e2e-validation',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL
      }
    },
    {
      name: 'integration',
      testDir: './tests/integration',
      use: {
        ...devices['Desktop Chrome'],
      }
    },
    {
      name: 'mobile',
      testDir: './tests/monitoring',
      use: { 
        ...devices['iPhone 12'],
        baseURL: DASHBOARD_URL
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: './tests/e2e/playwright/setup/global-setup.js',
  globalTeardown: './tests/e2e/playwright/setup/global-teardown.js',
  
  /* Run your local dev server before starting the tests */
  // webServer: process.env.CI ? undefined : {
  //   command: 'cd monitoring/dashboard && npm start',
  //   url: 'http://127.0.0.1:8080',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});