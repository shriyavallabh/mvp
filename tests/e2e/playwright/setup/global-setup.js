/**
 * Global Setup for Playwright E2E Tests
 * Runs once before all tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function globalSetup(config) {
  console.log('\n🚀 Starting Global Test Setup...\n');

  // Create test reports directory
  const reportsDir = path.join(__dirname, '../../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Initialize test run metadata
  const testRunMetadata = {
    startTime: new Date().toISOString(),
    environment: process.env.TEST_ENV || 'production',
    vmHost: '143.110.191.97',
    testSuite: 'FinAdvise E2E Testing Suite',
    totalTests: 0,
    config: {
      workers: config.workers,
      retries: config.retries,
      timeout: config.timeout
    }
  };

  // Save metadata
  fs.writeFileSync(
    path.join(reportsDir, 'test-run-metadata.json'),
    JSON.stringify(testRunMetadata, null, 2)
  );

  // Check VM connectivity
  console.log('📡 Checking VM connectivity...');
  try {
    execSync(`ping -c 1 143.110.191.97`, { stdio: 'ignore' });
    console.log('✅ VM is reachable');
  } catch (error) {
    console.warn('⚠️  VM is not reachable. Running in local mode.');
    // Don't exit, continue with local testing
  }

  // Check ngrok status
  console.log('🔗 Checking ngrok tunnel...');
  try {
    const ngrokResponse = await checkNgrokStatus();
    if (ngrokResponse) {
      process.env.NGROK_URL = ngrokResponse;
      console.log(`✅ Ngrok URL: ${ngrokResponse}`);
    } else {
      console.warn('⚠️  Ngrok tunnel not found. Some tests may fail.');
    }
  } catch (error) {
    console.warn('⚠️  Could not check ngrok status:', error.message);
  }

  // Setup test data
  console.log('📊 Setting up test data...');
  await setupTestData();

  // Create test advisors in Google Sheets if needed
  console.log('👥 Preparing test advisors...');
  await prepareTestAdvisors();

  // Clear old test artifacts
  console.log('🧹 Cleaning old test artifacts...');
  cleanTestArtifacts();

  console.log('\n✨ Global setup completed successfully!\n');
  
  // Return cleanup function
  return async () => {
    // This runs after all tests complete
    console.log('Running post-test cleanup...');
  };
}

async function checkNgrokStatus() {
  try {
    // Try local ngrok first
    const localResponse = await axios.get('http://localhost:4040/api/tunnels', {
      timeout: 3000
    });
    
    const tunnels = localResponse.data.tunnels;
    if (tunnels && tunnels.length > 0) {
      const webhookTunnel = tunnels.find(t => t.config.addr.includes('5001'));
      return webhookTunnel?.public_url;
    }
  } catch (error) {
    // Try VM ngrok
    try {
      const vmCheck = execSync(
        `ssh mvp@143.110.191.97 "curl -s http://localhost:4040/api/tunnels"`,
        { encoding: 'utf-8', timeout: 5000 }
      );
      
      const tunnels = JSON.parse(vmCheck).tunnels;
      if (tunnels && tunnels.length > 0) {
        const webhookTunnel = tunnels.find(t => t.config.addr.includes('5001'));
        return webhookTunnel?.public_url;
      }
    } catch (vmError) {
      return null;
    }
  }
  return null;
}

async function setupTestData() {
  // Create test fixtures directory
  const fixturesDir = path.join(__dirname, '../fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Create test data fixtures
  const testData = {
    testAdvisors: [
      {
        id: 'TEST_001',
        name: 'Test Advisor 1',
        phone: '+919999999001',
        email: 'test1@finadvise.com',
        active: true
      },
      {
        id: 'TEST_002', 
        name: 'Test Advisor 2',
        phone: '+919999999002',
        email: 'test2@finadvise.com',
        active: true
      },
      {
        id: 'TEST_003',
        name: 'Test Advisor 3',
        phone: '+919999999003',
        email: 'test3@finadvise.com',
        active: false
      }
    ],
    testContent: {
      validContent: 'Mutual funds are subject to market risks. Please read all scheme related documents carefully.',
      invalidContent: 'Guaranteed 50% returns! Invest now!',
      sebiCompliant: 'Past performance does not guarantee future results.',
      nonCompliant: 'This fund will definitely double your money'
    },
    webhookPayloads: {
      textMessage: {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'TEST_WABA_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550555000',
                phone_number_id: 'TEST_PHONE_ID'
              },
              messages: [{
                from: '919999999001',
                id: 'wamid.TEST_MESSAGE_ID',
                timestamp: Date.now(),
                text: { body: 'Test message' },
                type: 'text'
              }]
            }
          }]
        }]
      }
    }
  };

  fs.writeFileSync(
    path.join(fixturesDir, 'test-data.json'),
    JSON.stringify(testData, null, 2)
  );
}

async function prepareTestAdvisors() {
  // This would normally create test advisors in Google Sheets
  // For now, we'll just create a mock setup
  const testAdvisorsFile = path.join(__dirname, '../fixtures/test-advisors.json');
  
  const advisors = [];
  for (let i = 1; i <= 10; i++) {
    advisors.push({
      id: `TEST_${String(i).padStart(3, '0')}`,
      name: `Test Advisor ${i}`,
      phone: `+91999999900${i}`,
      email: `test${i}@finadvise.com`,
      active: i <= 8, // 8 active, 2 inactive
      contentPreferences: {
        topics: ['Equity', 'Debt', 'Hybrid'],
        frequency: 'daily',
        language: 'English'
      }
    });
  }

  fs.writeFileSync(testAdvisorsFile, JSON.stringify(advisors, null, 2));
}

function cleanTestArtifacts() {
  const artifactsToClean = [
    'tests/e2e/playwright/test-results',
    'tests/reports/playwright-report',
    'tests/reports/coverage'
  ];

  artifactsToClean.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
    fs.mkdirSync(fullPath, { recursive: true });
  });
}

module.exports = globalSetup;