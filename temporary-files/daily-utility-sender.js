#!/usr/bin/env node

/**
 * Story 3.2: Daily UTILITY Template Sender
 * =========================================
 * Sends UTILITY templates with interactive buttons at 5 AM daily
 * Implements the Click-to-Unlock strategy
 */

const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN,
    templateName: 'advisor_daily_content_ready',  // UTILITY template
    language: 'en',
    subscribersFile: '/home/mvp/data/active-subscribers.json',
    logFile: '/home/mvp/logs/daily-sender.log'
};

// Advisor phone numbers (production list)
const ADVISORS = [
    '919022810769',  // Avalok
    '918369865935',  // Vidyadhar  
    '919137926441',  // Shruti
    // Add more advisors here
];

/**
 * Log message to file and console
 */
async function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    try {
        const logDir = path.dirname(CONFIG.logFile);
        await fs.mkdir(logDir, { recursive: true });
        await fs.appendFile(CONFIG.logFile, logMessage + '\n');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

/**
 * Get list of active subscribers
 */
async function getActiveSubscribers() {
    try {
        // Try to load from file first
        const data = await fs.readFile(CONFIG.subscribersFile, 'utf-8');
        const subscribers = JSON.parse(data);
        return subscribers.filter(s => s.active !== false).map(s => s.phone);
    } catch (error) {
        // Fallback to hardcoded list
        await log(`Using hardcoded advisor list (${ADVISORS.length} advisors)`);
        return ADVISORS;
    }
}

/**
 * Send UTILITY template with interactive buttons
 */
async function sendUtilityTemplate(phoneNumber, advisorName = '') {
    try {
        const requestBody = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
                name: CONFIG.templateName,
                language: {
                    code: CONFIG.language
                },
                components: [
                    {
                        type: 'header',
                        parameters: [
                            {
                                type: 'text',
                                text: advisorName || 'Advisor'
                            }
                        ]
                    },
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: new Date().toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                            }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: '0',
                        parameters: [
                            {
                                type: 'payload',
                                payload: 'UNLOCK_IMAGES'
                            }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: '1',
                        parameters: [
                            {
                                type: 'payload',
                                payload: 'UNLOCK_CONTENT'
                            }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: '2',
                        parameters: [
                            {
                                type: 'payload',
                                payload: 'UNLOCK_UPDATES'
                            }
                        ]
                    }
                ]
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        await log(`✅ Template sent to ${phoneNumber}: ${response.data.messages?.[0]?.id}`);
        return { success: true, messageId: response.data.messages?.[0]?.id };

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        await log(`❌ Failed to send to ${phoneNumber}: ${errorMsg}`);
        
        // If template doesn't exist, send alternative message
        if (errorMsg.includes('template') || errorMsg.includes('not found')) {
            return sendAlternativeMessage(phoneNumber);
        }
        
        return { success: false, error: errorMsg };
    }
}

/**
 * Send alternative message if template not available
 */
async function sendAlternativeMessage(phoneNumber) {
    try {
        const message = `🌅 Good Morning!

Your daily financial content is ready for today, ${new Date().toLocaleDateString('en-IN')}.

Reply with:
📸 "images" - Get today's shareable images
📝 "content" - Get market insights
📊 "updates" - Get live updates

Or simply click any button when they appear!`;

        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        await log(`✅ Alternative message sent to ${phoneNumber}`);
        return { success: true, messageId: response.data.messages?.[0]?.id };

    } catch (error) {
        await log(`❌ Failed to send alternative to ${phoneNumber}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Send daily templates to all advisors
 */
async function sendDailyTemplates() {
    await log('\n🚀 STARTING DAILY UTILITY TEMPLATE BROADCAST');
    await log('============================================');
    
    const subscribers = await getActiveSubscribers();
    await log(`Found ${subscribers.length} active subscribers`);
    
    const results = {
        sent: 0,
        failed: 0,
        errors: []
    };
    
    for (const phone of subscribers) {
        await log(`Sending to ${phone}...`);
        
        const result = await sendUtilityTemplate(phone);
        
        if (result.success) {
            results.sent++;
        } else {
            results.failed++;
            results.errors.push({ phone, error: result.error });
        }
        
        // Wait 2 seconds between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await log('\n📊 BROADCAST COMPLETE');
    await log(`✅ Sent: ${results.sent}`);
    await log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
        await log('\nErrors:');
        for (const err of results.errors) {
            await log(`  - ${err.phone}: ${err.error}`);
        }
    }
    
    // Save results
    const resultsFile = `/home/mvp/logs/broadcast-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
    
    return results;
}

/**
 * Test send to single advisor
 */
async function testSend(phoneNumber) {
    await log('\n🧪 TEST MODE - Sending to single advisor');
    const result = await sendUtilityTemplate(phoneNumber);
    
    if (result.success) {
        await log('✅ Test successful!');
    } else {
        await log('❌ Test failed!');
    }
    
    return result;
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args[0] === '--test') {
        // Test mode - send to single number
        const testPhone = args[1] || '919022810769';
        await testSend(testPhone);
        
    } else if (args[0] === '--now') {
        // Send immediately to all
        await sendDailyTemplates();
        
    } else {
        // Schedule for 5 AM daily
        await log('📅 Scheduler started - Will send daily at 5:00 AM IST');
        
        // Schedule for 5:00 AM every day
        cron.schedule('0 5 * * *', async () => {
            await log('\n⏰ 5 AM Trigger activated');
            await sendDailyTemplates();
        }, {
            timezone: 'Asia/Kolkata'
        });
        
        // Also schedule a health check every hour
        cron.schedule('0 * * * *', async () => {
            await log('💓 Health check - Scheduler is running');
        });
        
        await log('✅ Daily UTILITY sender is running');
        await log('Next send: Tomorrow at 5:00 AM IST');
        
        // Keep process running
        process.stdin.resume();
    }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    await log('\n👋 Shutting down daily sender...');
    process.exit(0);
});

process.on('uncaughtException', async (error) => {
    await log(`❌ Uncaught exception: ${error.message}`);
    console.error(error);
});

// Run if executed directly
if (require.main === module) {
    main().catch(async (error) => {
        await log(`❌ Fatal error: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    sendUtilityTemplate,
    sendDailyTemplates,
    getActiveSubscribers
};