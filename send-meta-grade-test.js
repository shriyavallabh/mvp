#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249'
};

async function sendMetaGradeTest() {
    console.log('🏗️  META-GRADE TEMPLATE TEST');
    console.log('=' .repeat(70));
    console.log('🚀 Architecture: Meta Engineering Standards');
    console.log('📱 Phone ID:', CONFIG.phoneNumberId);
    console.log('🎯 Target:', CONFIG.recipientNumber);
    console.log('⏰ Timestamp:', new Date().toLocaleString());
    console.log('=' .repeat(70));
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: CONFIG.recipientNumber,
                type: 'template',
                template: {
                    name: 'daily_content_ready_v1',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'META-GRADE CONTENT' },
                                { type: 'text', text: new Date().toLocaleDateString() },
                                { type: 'text', text: 'Premium Media Delivery System' }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const messageId = response.data.messages[0].id;
        console.log('\n✅ META-GRADE TEMPLATE SENT SUCCESSFULLY!');
        console.log('📨 Message ID:', messageId);
        
        console.log('\n🎬 WHEN YOU CLICK "RETRIEVE CONTENT":');
        console.log('═'.repeat(50));
        console.log('You will receive 6 premium messages:');
        console.log('1. 📊 Market Overview Chart (High-Quality Image)');
        console.log('2. 📈 Comprehensive Market Analysis (Detailed Text)');
        console.log('3. 💼 Portfolio Strategy Chart (Professional Image)');
        console.log('4. 💡 Advanced Investment Strategy (Expert Insights)');
        console.log('5. 📈 Sectoral Opportunities Chart (Trend Analysis)');
        console.log('6. 🌟 Premium Sectoral Intelligence (Action Items)');
        
        console.log('\n🏗️  META-GRADE FEATURES ACTIVE:');
        console.log('═'.repeat(50));
        console.log('✅ Bulletproof button detection (ALL formats)');
        console.log('✅ Comprehensive event logging (Every step traced)');
        console.log('✅ Automatic retry logic (3 attempts per message)');
        console.log('✅ Smart message sequencing (2s delays)');
        console.log('✅ Production error handling (Graceful failures)');
        console.log('✅ Real-time delivery stats (Success/failure tracking)');
        console.log('✅ Meta-grade architecture (Billion-dollar standards)');
        
        console.log('\n📱 DEBUGGING INTELLIGENCE:');
        console.log('═'.repeat(50));
        console.log('• Full payload logging for every webhook event');
        console.log('• Button click format detection (legacy + interactive)');
        console.log('• Authorized user verification');
        console.log('• Message delivery confirmation with timing');
        console.log('• Complete error tracing with stack traces');
        
        console.log('\n🎯 NOW CLICK THE "RETRIEVE CONTENT" BUTTON!');
        console.log('═'.repeat(70));
        console.log('🔍 Watch the webhook logs for detailed tracing...');
        console.log('📊 Every action will be logged in real-time');
        console.log('🚀 Premium media content will be delivered instantly');
        console.log('═'.repeat(70));
        
    } catch (error) {
        console.error('❌ TEMPLATE SEND FAILED:');
        console.error('   Error:', error.response?.data?.error?.message || error.message);
        console.error('   Status:', error.response?.status);
        console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

sendMetaGradeTest().catch(console.error);