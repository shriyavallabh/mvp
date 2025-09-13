/**
 * Global Teardown for Playwright E2E Tests
 * Runs once after all tests complete
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function globalTeardown(config) {
  console.log('\n🏁 Starting Global Test Teardown...\n');

  const reportsDir = path.join(__dirname, '../../../reports');
  
  // Update test run metadata with completion info
  const metadataPath = path.join(reportsDir, 'test-run-metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    metadata.endTime = new Date().toISOString();
    metadata.duration = new Date(metadata.endTime) - new Date(metadata.startTime);
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  // Generate test summary
  console.log('📊 Generating test summary...');
  await generateTestSummary();

  // Clean up test data from Google Sheets if needed
  console.log('🧹 Cleaning up test data...');
  await cleanupTestData();

  // Archive test results
  console.log('📦 Archiving test results...');
  archiveTestResults();

  // Send notifications if configured
  if (process.env.SEND_TEST_NOTIFICATIONS === 'true') {
    console.log('📧 Sending test notifications...');
    await sendTestNotifications();
  }

  console.log('\n✨ Global teardown completed!\n');
}

async function generateTestSummary() {
  const reportsDir = path.join(__dirname, '../../../reports');
  const summaryPath = path.join(reportsDir, 'test-summary.md');
  
  let summary = '# FinAdvise E2E Test Summary\n\n';
  summary += `**Test Run Date:** ${new Date().toLocaleString()}\n\n`;
  
  // Try to read test results if available
  const resultsPath = path.join(reportsDir, 'test-results.json');
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      
      summary += '## Test Results\n\n';
      summary += `- **Total Tests:** ${results.stats?.tests || 0}\n`;
      summary += `- **Passed:** ${results.stats?.expected || 0}\n`;
      summary += `- **Failed:** ${results.stats?.unexpected || 0}\n`;
      summary += `- **Flaky:** ${results.stats?.flaky || 0}\n`;
      summary += `- **Skipped:** ${results.stats?.skipped || 0}\n\n`;
      
      // Add failed test details
      if (results.failures && results.failures.length > 0) {
        summary += '## Failed Tests\n\n';
        results.failures.forEach(failure => {
          summary += `### ${failure.title}\n`;
          summary += `- **File:** ${failure.file}\n`;
          summary += `- **Error:** ${failure.error}\n\n`;
        });
      }
    } catch (error) {
      console.error('Could not parse test results:', error);
    }
  }
  
  // Add performance metrics if available
  const performanceLog = path.join(reportsDir, 'performance-metrics.json');
  if (fs.existsSync(performanceLog)) {
    try {
      const metrics = JSON.parse(fs.readFileSync(performanceLog, 'utf-8'));
      summary += '## Performance Metrics\n\n';
      summary += `- **Average Response Time:** ${metrics.avgResponseTime}ms\n`;
      summary += `- **Peak Memory Usage:** ${metrics.peakMemory}MB\n`;
      summary += `- **Total Test Duration:** ${metrics.totalDuration}s\n\n`;
    } catch (error) {
      console.error('Could not parse performance metrics:', error);
    }
  }
  
  // Add coverage report link
  summary += '## Coverage Report\n\n';
  summary += 'View detailed coverage report: [HTML Report](./playwright-report/index.html)\n\n';
  
  // Add recommendations
  summary += '## Recommendations\n\n';
  summary += '- Review failed tests and fix identified issues\n';
  summary += '- Monitor performance metrics for degradation\n';
  summary += '- Update test cases for new features\n';
  
  fs.writeFileSync(summaryPath, summary);
  console.log(`Test summary saved to: ${summaryPath}`);
}

async function cleanupTestData() {
  // Clean up test advisors from Google Sheets
  // This would normally connect to Google Sheets API
  console.log('Cleaning up test advisors...');
  
  // Clean up test content
  console.log('Cleaning up test content...');
  
  // Clean up test webhook data
  console.log('Cleaning up webhook test data...');
  
  // Remove temporary test files
  const tempFiles = [
    'tests/e2e/playwright/fixtures/temp-*',
    'tests/e2e/playwright/downloads/*'
  ];
  
  tempFiles.forEach(pattern => {
    try {
      execSync(`rm -f ${pattern}`, { stdio: 'ignore' });
    } catch (error) {
      // Ignore errors for non-existent files
    }
  });
}

function archiveTestResults() {
  const reportsDir = path.join(__dirname, '../../../reports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveDir = path.join(reportsDir, 'archives', timestamp);
  
  // Create archive directory
  fs.mkdirSync(archiveDir, { recursive: true });
  
  // Files to archive
  const filesToArchive = [
    'test-results.json',
    'junit.xml',
    'test-summary.md',
    'test-run-metadata.json',
    'performance-metrics.json'
  ];
  
  filesToArchive.forEach(file => {
    const sourcePath = path.join(reportsDir, file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(archiveDir, file);
      fs.copyFileSync(sourcePath, destPath);
    }
  });
  
  // Archive playwright report if it exists
  const playwrightReport = path.join(reportsDir, 'playwright-report');
  if (fs.existsSync(playwrightReport)) {
    try {
      execSync(`cp -r ${playwrightReport} ${archiveDir}/`, { stdio: 'ignore' });
    } catch (error) {
      console.error('Could not archive playwright report:', error);
    }
  }
  
  console.log(`Test results archived to: ${archiveDir}`);
}

async function sendTestNotifications() {
  // This would send notifications via WhatsApp or email
  // For now, we'll just log
  console.log('Test notifications would be sent here');
  
  const webhook = process.env.TEST_NOTIFICATION_WEBHOOK;
  if (webhook) {
    try {
      // Send webhook notification
      console.log(`Sending notification to webhook: ${webhook}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

module.exports = globalTeardown;