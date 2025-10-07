#!/usr/bin/env node

/**
 * AiSensy Daily Notification Sender
 * Sends utility messages to all active advisors with link to their dashboard
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const AISENSY_API_KEY = process.env.AISENSY_API_KEY;
const AISENSY_BASE_URL = process.env.AISENSY_BASE_URL || 'https://api.aisensy.com';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://jarvisdaily.com/dashboard';

async function sendUtilityMessage(phone, name) {
  const url = `${AISENSY_BASE_URL}/campaign-manager/api/v1/campaign/t1/api/v2`;

  const payload = {
    apiKey: AISENSY_API_KEY,
    campaignName: `Daily Content - ${name} - ${new Date().toISOString()}`,
    destination: phone,
    userName: name,
    templateParams: [
      name, // Name parameter
      new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }) // Date parameter
    ],
    source: 'FinAdvise Daily',
    media: {},
    buttons: [
      {
        type: 'url',
        sub_type: 'url',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: `?phone=${phone}` // Phone number as query param
          }
        ]
      }
    ],
    carouselCards: [],
    location: {},
    paramsFallbackValue: {
      FirstName: name
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Sent to ${name} (${phone})`);
      return { success: true, data };
    } else {
      console.error(`❌ Failed for ${name} (${phone}):`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error(`❌ Error sending to ${name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function sendToAllAdvisors() {
  try {
    // Load advisors
    const advisorsPath = path.join(process.cwd(), 'data', 'advisors.json');
    const advisorsData = await fs.readFile(advisorsPath, 'utf-8');
    const advisors = JSON.parse(advisorsData);

    // Filter active advisors
    const activeAdvisors = advisors.filter(a => a.activeSubscription);

    console.log(`\n📤 Sending daily content links to ${activeAdvisors.length} advisors...\n`);
    console.log(`Dashboard URL: ${DASHBOARD_URL}\n`);

    const results = [];

    // Send to each advisor
    for (const advisor of activeAdvisors) {
      const result = await sendUtilityMessage(advisor.phone, advisor.name);
      results.push({ advisor: advisor.name, ...result });

      // Wait 1 second between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);

    // Save log
    const logPath = path.join(process.cwd(), 'data', 'send-logs.json');
    const log = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };

    await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    console.log(`\n💾 Log saved to: ${logPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  sendToAllAdvisors();
}

module.exports = { sendUtilityMessage, sendToAllAdvisors };
