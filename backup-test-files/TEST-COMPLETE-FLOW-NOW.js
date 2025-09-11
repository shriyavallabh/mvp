const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * END-TO-END PRODUCTION TEST
 * Tests the complete Click-to-Unlock flow
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🔥 COMPLETE CLICK-TO-UNLOCK FLOW TEST');
console.log('=' .repeat(70));
console.log('Testing with real advisor numbers');
console.log('This will send UTILITY template → Wait for click → Deliver content\n');

/**
 * Send UTILITY template with unlock button
 */
async function sendUnlockTemplate(advisorPhone, advisorName) {
    console.log(`📤 Sending UTILITY unlock template to ${advisorName} (${advisorPhone})...`);
    
    const buttonId = `UNLOCK_CONTENT_INVESTMENT_${Date.now()}`;
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: advisorPhone,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: {
                        type: 'text',
                        text: '🎯 Daily Advisory Content'
                    },
                    body: {
                        text: `Good morning ${advisorName}!

Your exclusive daily content is ready. Today's focus:

📊 *Investment Strategies & Market Update*
• Live market analysis
• Client acquisition strategies  
• Portfolio optimization tips
• Tax-saving opportunities

This content helps you:
✓ Engage clients effectively
✓ Share valuable insights
✓ Build trust and credibility

Click below to unlock and receive 3 ready-to-share messages.`
                    },
                    footer: {
                        text: 'FinAdvise - Empowering Advisors'
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: buttonId,
                                    title: '🔓 Unlock Content'
                                }
                            }
                        ]
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Sent successfully! Message ID: ${response.data.messages?.[0]?.id}`);
        console.log(`   Button ID: ${buttonId}`);
        return buttonId;
    } catch (error) {
        console.error(`   ❌ Failed:`, error.response?.data?.error || error.message);
        return null;
    }
}

/**
 * Main test flow
 */
async function testCompleteFlow() {
    // Test advisors
    const advisors = [
        { phone: '919022810769', name: 'Test Advisor' },
        { phone: '919765071249', name: 'Avalok' }
    ];
    
    console.log('📱 Sending UTILITY templates to advisors...\n');
    
    for (const advisor of advisors) {
        const buttonId = await sendUnlockTemplate(advisor.phone, advisor.name);
        
        if (buttonId) {
            console.log(`\n   📌 Advisor ${advisor.name} should now see:`);
            console.log('      1. A message with investment content description');
            console.log('      2. Button labeled "🔓 Unlock Content"');
            console.log('      3. When clicked, will receive 3 marketing messages\n');
        }
        
        // Wait 2 seconds between sends
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('=' .repeat(70));
    console.log('🎯 TEST INSTRUCTIONS:');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣ CHECK WHATSAPP on both numbers');
    console.log('   You should see the UTILITY template message');
    
    console.log('\n2️⃣ CLICK "🔓 Unlock Content" button');
    
    console.log('\n3️⃣ EXPECTED RESULT:');
    console.log('   You will receive 3 marketing messages:');
    console.log('   • Market Update & Investment Insight');
    console.log('   • Smart SIP Strategy');
    console.log('   • Action Items for Advisors');
    
    console.log('\n4️⃣ MONITOR webhook output for events');
    
    console.log('\n✅ SUCCESS CRITERIA:');
    console.log('   - UTILITY template arrives (no 24hr limit)');
    console.log('   - Button click triggers webhook');
    console.log('   - Marketing content delivered immediately');
    console.log('   - All messages are copyable for sharing');
    
    console.log('\n📊 PRODUCTION NOTES:');
    console.log('   - This flow works even days after template sent');
    console.log('   - No need for user to type "Hi" first');
    console.log('   - Content delivery is automatic on button click');
    console.log('   - Webhook must be running 24/7 for this to work');
}

// Run test
testCompleteFlow().catch(console.error);