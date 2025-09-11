#!/usr/bin/env node

/**
 * End-to-End Test for Click-to-Unlock Strategy
 * Tests the complete flow from template sending to content delivery
 */

const axios = require('axios');
const { whatsAppConfig } = require('./config/env.config');
const { Logger } = require('./utils/logger');
const fs = require('fs').promises;
const path = require('path');

const logger = new Logger({ name: 'E2E-Test' });

// Load approved utility templates
let APPROVED_TEMPLATES = [];

/**
 * Load approved utility templates from saved results
 */
async function loadApprovedTemplates() {
    try {
        const data = await fs.readFile('utility-templates-approved.json', 'utf8');
        const results = JSON.parse(data);
        APPROVED_TEMPLATES = results.utilityTemplates;
        return APPROVED_TEMPLATES;
    } catch (error) {
        console.error('❌ No approved templates found. Run check-template-categories.js first.');
        process.exit(1);
    }
}

/**
 * Send unlock template to advisor
 */
async function sendUnlockTemplate(advisor, templateName) {
    const url = `https://graph.facebook.com/v21.0/${whatsAppConfig.phoneNumberId}/messages`;
    
    const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric', 
        year: 'numeric'
    });
    
    const contentId = `CNT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: advisor.phone.replace('+', ''),
        type: 'template',
        template: {
            name: templateName,
            language: { code: 'en' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: advisor.name },
                        { type: 'text', text: today },
                        { type: 'text', text: contentId }
                    ]
                },
                {
                    type: 'button',
                    sub_type: 'quick_reply',
                    index: '0',
                    parameters: [{
                        type: 'payload',
                        payload: `UNLOCK_${contentId}`
                    }]
                }
            ]
        }
    };
    
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${whatsAppConfig.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            messageId: response.data.messages?.[0]?.id,
            contentId,
            advisor: advisor.name,
            template: templateName
        };
        
    } catch (error) {
        return {
            success: false,
            advisor: advisor.name,
            template: templateName,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Run end-to-end test with all advisors
 */
async function runEndToEndTest() {
    console.log('\n🧪 CLICK-TO-UNLOCK END-TO-END TEST');
    console.log('=' .repeat(70));
    
    // Load approved templates
    const templates = await loadApprovedTemplates();
    
    if (templates.length === 0) {
        console.error('❌ No approved UTILITY templates available!');
        return;
    }
    
    console.log(`✅ Found ${templates.length} approved UTILITY templates`);
    console.log('Templates:', templates.map(t => t.name).join(', '));
    
    // Load subscriber data
    const subscriberData = JSON.parse(
        await fs.readFile('./subscriber-records.json', 'utf8')
    );
    
    const advisors = [
        ...subscriberData.subscribers,
        { name: 'Test User', phone: '919022810769', segment: 'Premium' }
    ];
    
    console.log(`\n📱 Testing with ${advisors.length} advisors`);
    console.log('=' .repeat(70));
    
    const results = [];
    
    // Use the first approved template for all advisors
    const templateToUse = templates[0].name;
    console.log(`\nUsing template: ${templateToUse}\n`);
    
    for (const advisor of advisors) {
        console.log(`Sending to ${advisor.name} (${advisor.phone})...`);
        
        const result = await sendUnlockTemplate(advisor, templateToUse);
        results.push(result);
        
        if (result.success) {
            console.log(`   ✅ Sent! Message ID: ${result.messageId}`);
            console.log(`   📌 Content ID: ${result.contentId}`);
            console.log(`   🔓 Button payload: UNLOCK_${result.contentId}`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
        
        // Delay between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('=' .repeat(70));
    console.log(`✅ Successful: ${successful.length}/${advisors.length}`);
    console.log(`❌ Failed: ${failed.length}/${advisors.length}`);
    
    if (successful.length > 0) {
        console.log('\n📱 WHAT ADVISORS WILL SEE:');
        console.log('1. A UTILITY template with a button');
        console.log('2. Message says their content is ready');
        console.log('3. Button says "Retrieve Content" or similar');
        console.log('4. When clicked, opens 24-hour window');
        
        console.log('\n🔓 HOW TO TEST THE UNLOCK:');
        console.log('1. Advisors should click the button in WhatsApp');
        console.log('2. Webhook will capture the click event');
        console.log('3. System will send the actual content');
        console.log('4. Content can be copied and forwarded');
    }
    
    // Save test results
    const testResults = {
        timestamp: new Date().toISOString(),
        template: templateToUse,
        summary: {
            total: advisors.length,
            successful: successful.length,
            failed: failed.length
        },
        results,
        contentIds: successful.map(r => ({
            advisor: r.advisor,
            contentId: r.contentId,
            messageId: r.messageId
        }))
    };
    
    await fs.writeFile(
        `e2e-test-results-${Date.now()}.json`,
        JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n📁 Test results saved');
    
    // Instructions for monitoring
    console.log('\n🔍 MONITORING INSTRUCTIONS:');
    console.log('1. Start webhook handler: node services/whatsapp/unlock-webhook-handler.js');
    console.log('2. Configure Meta webhook URL to your server');
    console.log('3. Ask advisors to click the button');
    console.log('4. Monitor webhook logs for button clicks');
    console.log('5. Verify content delivery after clicks');
    
    // Create content queue for testing
    await createTestContentQueue(successful);
    
    console.log('\n✨ End-to-end test complete!');
    
    return results;
}

/**
 * Create test content in the queue
 */
async function createTestContentQueue(successfulSends) {
    const queueFile = path.join(__dirname, 'data', 'content-queue.json');
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(queueFile), { recursive: true });
    
    const queue = {};
    
    for (const send of successfulSends) {
        const advisor = send.advisor;
        const contentId = send.contentId;
        
        // Create test content for this advisor
        queue[advisor] = {
            pending: [{
                id: contentId,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                content: {
                    introduction: `Test content for ${advisor}`,
                    posts: [
                        {
                            platform: 'LinkedIn',
                            text: `📊 Test Financial Tip:\n\nThis is test content that was unlocked by clicking the button.\n\nIf you're seeing this, the click-to-unlock strategy is working!`,
                            hashtags: ['#Test', '#ClickToUnlock', '#Success'],
                            imageUrl: null
                        },
                        {
                            platform: 'WhatsApp',
                            text: `✅ SUCCESS!\n\nYou successfully unlocked content by clicking the button.\n\nThis proves the 24-hour window bypass is working.`,
                            hashtags: [],
                            imageUrl: null
                        }
                    ]
                },
                status: 'pending',
                templateMessageId: send.messageId
            }],
            delivered: [],
            lastActivity: null
        };
    }
    
    await fs.writeFile(queueFile, JSON.stringify(queue, null, 2));
    console.log('\n📦 Test content queue created');
}

/**
 * Test with different template variations
 */
async function testMultipleTemplates() {
    console.log('\n🔄 TESTING MULTIPLE TEMPLATE VARIATIONS');
    console.log('=' .repeat(70));
    
    const templates = await loadApprovedTemplates();
    
    if (templates.length < 3) {
        console.log('Need at least 3 approved templates for variation testing');
        return;
    }
    
    // Test advisor
    const testAdvisor = { 
        name: 'Test Multi', 
        phone: '919022810769',
        segment: 'Test'
    };
    
    const results = [];
    
    // Send 3 different templates to same advisor
    for (let i = 0; i < Math.min(3, templates.length); i++) {
        const template = templates[i];
        console.log(`\nTest ${i + 1}: Using template "${template.name}"`);
        
        const result = await sendUnlockTemplate(testAdvisor, template.name);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ Sent successfully`);
            console.log(`   Content ID: ${result.contentId}`);
        } else {
            console.log(`❌ Failed: ${result.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('\n📊 Multi-template test complete');
    console.log('The advisor should now have 3 different unlock messages');
    console.log('Each can be clicked independently to retrieve specific content');
    
    return results;
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'multi') {
        // Test multiple templates
        testMultipleTemplates().catch(console.error);
    } else {
        // Run standard E2E test
        runEndToEndTest().catch(console.error);
    }
}

module.exports = {
    runEndToEndTest,
    sendUnlockTemplate,
    testMultipleTemplates
};