const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Track and Diagnose WhatsApp Message Delivery
 * Check actual delivery status and diagnose issues
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

console.log('\n🔍 WHATSAPP DELIVERY TRACKER & DIAGNOSTIC TOOL');
console.log('=' .repeat(70));
console.log('Checking delivery status for 9765071249 (Avalok)\n');

// Message IDs from previous attempts
const messageIds = [
    {
        id: 'wamid.HBgMOTE5NzY1MDcxMjQ5FQIAERgSOEEwNjJGRTE4OEE4MjZFNzQzAA==',
        template: 'finadvise_daily_v1757531949615',
        type: 'MARKETING',
        time: '11:28 AM'
    }
];

async function checkMessageStatus(messageId) {
    console.log(`\n📊 Checking Message: ${messageId.id.substring(0, 50)}...`);
    console.log(`   Template: ${messageId.template}`);
    console.log(`   Type: ${messageId.type}`);
    
    try {
        // Try to get message status (note: this endpoint may not be available for all accounts)
        const url = `https://graph.facebook.com/${config.apiVersion}/${messageId.id}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${config.accessToken}` }
        });
        
        console.log('   Status:', response.data);
    } catch (error) {
        console.log('   ⚠️  Cannot fetch individual message status via API');
    }
}

async function checkPhoneNumberQuality() {
    console.log('\n📱 Checking Phone Number Quality & Status...');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}?fields=quality_rating,status,display_phone_number,verified_name,code_verification_status,is_official_business_account`,
            {
                headers: { 'Authorization': `Bearer ${config.accessToken}` }
            }
        );
        
        console.log('   Display Number:', response.data.display_phone_number || 'N/A');
        console.log('   Quality Rating:', response.data.quality_rating || 'UNKNOWN');
        console.log('   Status:', response.data.status || 'N/A');
        console.log('   Verified Name:', response.data.verified_name || 'N/A');
        
        if (response.data.quality_rating === 'RED' || response.data.quality_rating === 'YELLOW') {
            console.log('   ⚠️  WARNING: Low quality rating may affect delivery!');
        }
    } catch (error) {
        console.log('   Error checking quality:', error.response?.data?.error?.message || error.message);
    }
}

async function testDeliveryToAvalok() {
    console.log('\n🧪 TESTING DIFFERENT APPROACHES FOR 9765071249');
    console.log('-'.repeat(50));
    
    const approaches = [
        {
            name: 'UTILITY Template (Best Delivery)',
            async send() {
                const payload = {
                    messaging_product: 'whatsapp',
                    to: '919765071249',
                    type: 'template',
                    template: {
                        name: 'finadvise_account_update_v1757563699228',
                        language: { code: 'en' },
                        components: [
                            {
                                type: 'header',
                                parameters: [{
                                    type: 'image',
                                    image: { 
                                        link: 'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_960_720.jpg'
                                    }
                                }]
                            },
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: 'Avalok' },
                                    { type: 'text', text: 'January 11, 2025' },
                                    { type: 'text', text: '45,00,000' },
                                    { type: 'text', text: '+15.3%' },
                                    { type: 'text', text: 'Review ELSS for tax benefits' }
                                ]
                            }
                        ]
                    }
                };
                
                return await sendMessage(payload);
            }
        },
        {
            name: 'Text Template Only (Diagnostic)',
            async send() {
                const payload = {
                    messaging_product: 'whatsapp',
                    to: '919765071249',
                    type: 'template',
                    template: {
                        name: 'hello_world',
                        language: { code: 'en_US' }
                    }
                };
                
                return await sendMessage(payload);
            }
        },
        {
            name: 'Marketing Template with Fixed Button',
            async send() {
                const payload = {
                    messaging_product: 'whatsapp',
                    to: '919765071249',
                    type: 'template',
                    template: {
                        name: 'finadvise_daily_v1757531949615',
                        language: { code: 'en' },
                        components: [
                            {
                                type: 'header',
                                parameters: [{
                                    type: 'image',
                                    image: { 
                                        link: 'https://via.placeholder.com/600x400.jpg'
                                    }
                                }]
                            },
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: 'Avalok' },
                                    { type: 'text', text: '45,00,000' },
                                    { type: 'text', text: '15.3' },
                                    { type: 'text', text: 'Review ELSS investments' },
                                    { type: 'text', text: '22,350' },
                                    { type: 'text', text: '73,850' }
                                ]
                            },
                            {
                                type: 'button',
                                sub_type: 'url',
                                index: '0',
                                parameters: [{
                                    type: 'text',
                                    text: 'avalok-report'
                                }]
                            }
                        ]
                    }
                };
                
                return await sendMessage(payload);
            }
        }
    ];
    
    for (const approach of approaches) {
        console.log(`\n📤 Trying: ${approach.name}`);
        const result = await approach.send();
        
        if (result.success) {
            console.log(`   ✅ Sent! Message ID: ${result.messageId}`);
            console.log(`   📱 CHECK WHATSAPP NOW on 9765071249`);
            
            // Save for tracking
            messageIds.push({
                id: result.messageId,
                template: approach.name,
                type: 'TEST',
                time: new Date().toLocaleTimeString()
            });
            
            // Wait 5 seconds to check delivery
            console.log('   ⏱️  Waiting 5 seconds to check delivery...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // In production, you'd check webhook events here
            console.log('   📊 To verify delivery:');
            console.log('      1. Check WhatsApp on 9765071249');
            console.log('      2. Look for message from 574744175733556');
            console.log('      3. Note if image appears');
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
        
        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function sendMessage(payload) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.messages?.[0]?.id) {
            return {
                success: true,
                messageId: response.data.messages[0].id,
                contact: response.data.contacts?.[0]
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message,
            errorCode: error.response?.data?.error?.code
        };
    }
}

async function diagnoseDeliveryIssues() {
    console.log('\n\n🔬 DIAGNOSIS: Why Messages May Not Be Delivered');
    console.log('=' .repeat(70));
    
    console.log('\n1. API ACCEPTANCE vs DELIVERY:');
    console.log('   • API returns success = Message accepted by WhatsApp');
    console.log('   • Actual delivery depends on:');
    console.log('     - User has WhatsApp installed and active');
    console.log('     - User hasn\'t blocked the business');
    console.log('     - No rate limits or caps hit');
    console.log('     - Network connectivity');
    
    console.log('\n2. MARKETING TEMPLATE SPECIFIC ISSUES:');
    console.log('   • Daily marketing message cap (varies per user)');
    console.log('   • User\'s WhatsApp settings may block marketing');
    console.log('   • Quality rating affects delivery priority');
    
    console.log('\n3. DELIVERY VERIFICATION:');
    console.log('   • Without webhooks, we can\'t track actual delivery');
    console.log('   • Need webhook endpoint to receive delivery confirmations');
    console.log('   • Webhook events tell us: sent → delivered → read → failed');
    
    console.log('\n4. IMMEDIATE ACTIONS:');
    console.log('   ✓ Try UTILITY template (better delivery)');
    console.log('   ✓ Check if hello_world delivers (baseline test)');
    console.log('   ✓ Verify phone number is active on WhatsApp');
    console.log('   ✓ Check message requests/spam folder');
    console.log('   ✓ Wait 2-5 minutes for delayed delivery');
}

async function main() {
    // Check phone number quality
    await checkPhoneNumberQuality();
    
    // Check previous message status
    for (const msg of messageIds) {
        await checkMessageStatus(msg);
    }
    
    // Test different approaches
    await testDeliveryToAvalok();
    
    // Diagnose issues
    await diagnoseDeliveryIssues();
    
    // Summary
    console.log('\n\n📊 SUMMARY & RECOMMENDATIONS');
    console.log('=' .repeat(70));
    console.log('\n1. If UTILITY template works but MARKETING doesn\'t:');
    console.log('   → Use UTILITY for critical daily updates');
    console.log('   → Marketing cap may be hit for that user');
    
    console.log('\n2. If hello_world works but media templates don\'t:');
    console.log('   → Image loading issue');
    console.log('   → Try different image URLs');
    
    console.log('\n3. If nothing delivers:');
    console.log('   → Check if number blocked the business');
    console.log('   → Verify number is active on WhatsApp');
    
    console.log('\n4. To track actual delivery:');
    console.log('   → Set up webhook endpoint');
    console.log('   → Process delivery confirmations');
    console.log('   → Build retry logic based on failures');
    
    // Save diagnostic report
    const report = {
        timestamp: new Date().toISOString(),
        target: '919765071249',
        messagesSent: messageIds,
        diagnosis: 'Check WhatsApp on device for actual delivery'
    };
    
    fs.writeFileSync(
        `delivery-diagnostic-${Date.now()}.json`,
        JSON.stringify(report, null, 2)
    );
    
    console.log('\n📁 Diagnostic report saved');
    console.log('\n🔍 PLEASE CHECK: WhatsApp on 9765071249 now!');
}

main().catch(console.error);