#!/usr/bin/env node

/**
 * Complete Daily Automation Workflow
 *
 * Steps:
 * 1. Generate viral content for all advisors
 * 2. Upload images to Cloudinary
 * 3. Send AiSensy notification to all advisors
 * 4. Log completion
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function runDailyWorkflow() {
  console.log('\n🚀 Starting Daily Content Workflow\n');
  console.log('=' .repeat(50));

  const startTime = Date.now();
  let sessionPath = null;

  try {
    // Step 1: Generate content
    console.log('\n📝 Step 1: Generating viral content...\n');

    try {
      // Run your content generation script
      execSync('python3 orchestrate-finadvise.py', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Find the latest session
      const outputDir = path.join(process.cwd(), 'output');
      const sessions = await fs.readdir(outputDir);
      const latestSession = sessions
        .filter(s => s.startsWith('session_'))
        .sort()
        .reverse()[0];

      if (!latestSession) {
        throw new Error('No session found after content generation');
      }

      sessionPath = path.join(outputDir, latestSession);
      console.log(`✅ Content generated: ${latestSession}`);

    } catch (error) {
      console.error('❌ Content generation failed:', error.message);
      throw error;
    }

    // Step 2: Upload images to Cloudinary
    console.log('\n📤 Step 2: Uploading images to Cloudinary...\n');

    try {
      const { uploadSessionImages } = require('./upload-images-cloudinary');
      const uploadResults = await uploadSessionImages(sessionPath);
      console.log(`✅ Uploaded ${uploadResults.length} images`);
    } catch (error) {
      console.error('⚠️  Image upload failed (continuing anyway):', error.message);
    }

    // Step 3: Send notifications
    console.log('\n📱 Step 3: Sending WhatsApp notifications...\n');

    try {
      const { sendToAllAdvisors } = require('./send-aisensy');
      await sendToAllAdvisors();
      console.log('✅ Notifications sent');
    } catch (error) {
      console.error('❌ Notification sending failed:', error.message);
      throw error;
    }

    // Step 4: Log completion
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionPath,
      duration: `${duration} minutes`,
      status: 'success'
    };

    const logPath = path.join(process.cwd(), 'data', 'workflow-log.json');

    // Append to log
    let logs = [];
    try {
      const existingLogs = await fs.readFile(logPath, 'utf-8');
      logs = JSON.parse(existingLogs);
    } catch (e) {
      // File doesn't exist yet
    }

    logs.push(logEntry);

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    logs = logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);

    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Daily workflow completed in ${duration} minutes!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Session: ${path.basename(sessionPath)}`);
    console.log(`   Dashboard: https://jarvisdaily.com/dashboard`);
    console.log(`   Log: ${logPath}\n`);

  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);

    // Log failure
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionPath,
      error: error.message,
      status: 'failed'
    };

    const logPath = path.join(process.cwd(), 'data', 'workflow-log.json');
    let logs = [];

    try {
      const existingLogs = await fs.readFile(logPath, 'utf-8');
      logs = JSON.parse(existingLogs);
    } catch (e) {}

    logs.push(logEntry);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

    process.exit(1);
  }
}

// Run
if (require.main === module) {
  runDailyWorkflow();
}

module.exports = { runDailyWorkflow };
