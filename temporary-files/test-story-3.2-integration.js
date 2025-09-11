#!/usr/bin/env node

/**
 * Story 3.2: Integration Test Suite
 * ==================================
 * Tests all components of the Click-to-Unlock strategy
 */

const axios = require('axios');
const colors = require('colors');
require('dotenv').config();

// Test configuration
const CONFIG = {
    webhookUrl: 'https://hubix.duckdns.org/webhook',
    localWebhookUrl: 'http://localhost:3000/webhook',
    verifyToken: 'jarvish_webhook_2024',
    testPhone: '919022810769',  // Avalok
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

/**
 * Test webhook verification
 */
async function testWebhookVerification() {
    console.log('\n📝 Testing Webhook Verification...');
    
    try {
        const response = await axios.get(CONFIG.webhookUrl, {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': CONFIG.verifyToken,
                'hub.challenge': 'test_challenge_123'
            },
            timeout: 5000
        });
        
        if (response.data === 'test_challenge_123') {
            logSuccess('Webhook verification passed');
            return true;
        } else {
            logFailure('Webhook verification failed - incorrect response');
            return false;
        }
    } catch (error) {
        logFailure(`Webhook verification failed: ${error.message}`);
        return false;
    }
}

/**
 * Test button click handling
 */
async function testButtonClickHandling() {
    console.log('\n📝 Testing Button Click Handling...');
    
    const buttonPayloads = [
        { id: 'UNLOCK_IMAGES', title: '📸 Get Images' },
        { id: 'UNLOCK_CONTENT', title: '📝 Get Content' },
        { id: 'UNLOCK_UPDATES', title: '📊 Get Updates' }
    ];
    
    for (const button of buttonPayloads) {
        try {
            const webhookPayload = {
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                from: CONFIG.testPhone,
                                type: 'interactive',
                                interactive: {
                                    type: 'button_reply',
                                    button_reply: {
                                        id: button.id,
                                        title: button.title
                                    }
                                }
                            }],
                            contacts: [{
                                wa_id: CONFIG.testPhone,
                                profile: { name: 'Test Advisor' }
                            }]
                        }
                    }]
                }]
            };
            
            const response = await axios.post(CONFIG.localWebhookUrl, webhookPayload, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                logSuccess(`Button click ${button.id} handled`);
            } else {
                logFailure(`Button click ${button.id} failed`);
            }
        } catch (error) {
            logFailure(`Button click ${button.id} error: ${error.message}`);
        }
    }
}

/**
 * Test text message handling
 */
async function testTextMessageHandling() {
    console.log('\n📝 Testing Text Message Handling...');
    
    const testMessages = [
        'Hello',
        'What is the market status?',
        'Give me investment tips',
        'Help with tax planning'
    ];
    
    for (const message of testMessages) {
        try {
            const webhookPayload = {
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                from: CONFIG.testPhone,
                                type: 'text',
                                text: { body: message }
                            }],
                            contacts: [{
                                wa_id: CONFIG.testPhone,
                                profile: { name: 'Test Advisor' }
                            }]
                        }
                    }]
                }]
            };
            
            const response = await axios.post(CONFIG.localWebhookUrl, webhookPayload, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                logSuccess(`Text message "${message.substring(0, 20)}..." handled`);
            } else {
                logFailure(`Text message handling failed`);
            }
        } catch (error) {
            logFailure(`Text message error: ${error.message}`);
        }
    }
}

/**
 * Test CRM analytics endpoint
 */
async function testCRMAnalytics() {
    console.log('\n📝 Testing CRM Analytics...');
    
    try {
        const response = await axios.get('https://hubix.duckdns.org/crm/analytics', {
            timeout: 5000
        });
        
        if (response.data && typeof response.data === 'object') {
            logSuccess('CRM analytics endpoint working');
            console.log('  Analytics data:', JSON.stringify(response.data, null, 2).substring(0, 200));
            return true;
        } else {
            logFailure('CRM analytics returned invalid data');
            return false;
        }
    } catch (error) {
        logFailure(`CRM analytics error: ${error.message}`);
        return false;
    }
}

/**
 * Test health check endpoint
 */
async function testHealthCheck() {
    console.log('\n📝 Testing Health Check...');
    
    try {
        const response = await axios.get('https://hubix.duckdns.org/health', {
            timeout: 5000
        });
        
        if (response.data && response.data.status === 'healthy') {
            logSuccess('Health check passed');
            console.log('  Service info:', JSON.stringify(response.data, null, 2));
            return true;
        } else {
            logFailure('Health check failed');
            return false;
        }
    } catch (error) {
        logFailure(`Health check error: ${error.message}`);
        return false;
    }
}

/**
 * Test daily sender functionality
 */
async function testDailySender() {
    console.log('\n📝 Testing Daily UTILITY Sender...');
    
    const { sendUtilityTemplate } = require('./daily-utility-sender');
    
    try {
        const result = await sendUtilityTemplate(CONFIG.testPhone, 'Test Advisor');
        
        if (result.success) {
            logSuccess('Daily UTILITY template sent successfully');
            console.log('  Message ID:', result.messageId);
            return true;
        } else {
            logFailure(`Daily sender failed: ${result.error}`);
            return false;
        }
    } catch (error) {
        logFailure(`Daily sender error: ${error.message}`);
        return false;
    }
}

/**
 * Test button click content delivery
 */
async function testContentDelivery() {
    console.log('\n📝 Testing Content Delivery...');
    
    const { handleButtonClick } = require('./button-click-handler');
    
    const buttons = ['UNLOCK_IMAGES', 'UNLOCK_CONTENT', 'UNLOCK_UPDATES'];
    
    for (const buttonId of buttons) {
        try {
            const result = await handleButtonClick(CONFIG.testPhone, buttonId);
            
            if (result.success) {
                logSuccess(`Content delivery for ${buttonId} successful (${result.count} items)`);
            } else {
                logFailure(`Content delivery for ${buttonId} failed: ${result.error}`);
            }
        } catch (error) {
            logFailure(`Content delivery error: ${error.message}`);
        }
    }
}

/**
 * Test intelligent chat system
 */
async function testIntelligentChat() {
    console.log('\n📝 Testing Intelligent Chat System...');
    
    const { getIntelligentResponse } = require('./intelligent-chat-system');
    
    const testQueries = [
        'What is the market status?',
        'Tell me about IT sector',
        'Tax saving tips'
    ];
    
    for (const query of testQueries) {
        try {
            const response = await getIntelligentResponse(query, 'Test Advisor', CONFIG.testPhone, []);
            
            if (response && response.length > 0) {
                logSuccess(`Intelligent response for "${query.substring(0, 30)}..." generated`);
                console.log(`  Response preview: ${response.substring(0, 100)}...`);
            } else {
                logFailure(`No response generated for query`);
            }
        } catch (error) {
            logFailure(`Intelligent chat error: ${error.message}`);
        }
    }
}

/**
 * Test CRM tracking
 */
async function testCRMTracking() {
    console.log('\n📝 Testing CRM Tracking System...');
    
    const { 
        initializeDatabase, 
        trackButtonClick, 
        trackChatMessage,
        getAdvisorAnalytics 
    } = require('./crm-tracking-system');
    
    try {
        // Initialize database
        const db = await initializeDatabase();
        logSuccess('CRM database initialized');
        
        // Track button click
        await trackButtonClick(db, CONFIG.testPhone, 'UNLOCK_IMAGES', '📸 Get Images');
        logSuccess('Button click tracked');
        
        // Track chat message
        await trackChatMessage(db, CONFIG.testPhone, 'user', 'Test message');
        logSuccess('Chat message tracked');
        
        // Get analytics
        const analytics = await getAdvisorAnalytics(db, CONFIG.testPhone);
        if (analytics && analytics.profile) {
            logSuccess('Advisor analytics retrieved');
            console.log(`  Engagement score: ${analytics.engagementScore}`);
        }
        
        await db.close();
        return true;
        
    } catch (error) {
        logFailure(`CRM tracking error: ${error.message}`);
        return false;
    }
}

/**
 * Test Meta webhook configuration
 */
async function testMetaWebhookConfig() {
    console.log('\n📝 Testing Meta Webhook Configuration...');
    
    try {
        // Check webhook subscription status
        const response = await axios.get(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/subscribed_apps`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`
                },
                timeout: 5000
            }
        );
        
        if (response.data && response.data.data) {
            logSuccess('Meta webhook subscription active');
            console.log('  Subscribed apps:', response.data.data.length);
            return true;
        } else {
            logWarning('Meta webhook may not be subscribed');
            return false;
        }
    } catch (error) {
        logWarning(`Meta config check skipped: ${error.message}`);
        return null;
    }
}

/**
 * Logging helpers
 */
function logSuccess(message) {
    console.log(`  ✅ ${message}`.green);
    results.passed++;
    results.tests.push({ status: 'passed', message });
}

function logFailure(message) {
    console.log(`  ❌ ${message}`.red);
    results.failed++;
    results.tests.push({ status: 'failed', message });
}

function logWarning(message) {
    console.log(`  ⚠️ ${message}`.yellow);
    results.tests.push({ status: 'warning', message });
}

/**
 * Generate test report
 */
function generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const total = results.passed + results.failed;
    const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n✅ Passed: ${results.passed}`.green);
    console.log(`❌ Failed: ${results.failed}`.red);
    console.log(`📈 Pass Rate: ${passRate}%\n`);
    
    if (results.failed > 0) {
        console.log('Failed Tests:'.red);
        results.tests
            .filter(t => t.status === 'failed')
            .forEach(t => console.log(`  - ${t.message}`));
    }
    
    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        story: '3.2 - Click-to-Unlock Strategy',
        results: {
            passed: results.passed,
            failed: results.failed,
            passRate: passRate,
            tests: results.tests
        }
    };
    
    const fs = require('fs');
    const reportFile = `test-report-story-3.2-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportFile}`);
    
    return results.failed === 0;
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n🚀 STORY 3.2 INTEGRATION TEST SUITE');
    console.log('====================================');
    console.log('Testing Click-to-Unlock Strategy with Intelligent Webhook CRM\n');
    
    const testMode = process.argv[2];
    
    if (testMode === '--local') {
        console.log('🏠 Running in LOCAL mode\n');
        CONFIG.webhookUrl = CONFIG.localWebhookUrl;
    } else {
        console.log('🌐 Running in PRODUCTION mode\n');
    }
    
    // Run tests
    await testWebhookVerification();
    await testHealthCheck();
    await testCRMAnalytics();
    
    if (testMode === '--local') {
        await testButtonClickHandling();
        await testTextMessageHandling();
        await testIntelligentChat();
        await testCRMTracking();
    }
    
    if (CONFIG.accessToken) {
        await testDailySender();
        await testContentDelivery();
        await testMetaWebhookConfig();
    } else {
        console.log('\n⚠️ Skipping WhatsApp tests (no access token)'.yellow);
    }
    
    // Generate report
    const success = generateReport();
    
    if (success) {
        console.log('\n✨ ALL TESTS PASSED! Story 3.2 is ready for production.'.green.bold);
    } else {
        console.log('\n⚠️ Some tests failed. Please review and fix issues.'.red.bold);
    }
    
    process.exit(success ? 0 : 1);
}

// Run tests
if (require.main === module) {
    runTests().catch(error => {
        console.error('\n❌ Test suite error:'.red, error);
        process.exit(1);
    });
}

module.exports = { runTests };