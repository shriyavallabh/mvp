const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send WhatsApp messages to advisors with correct template parameters
 * Using the exact structure we discovered
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

// Load subscriber data
const subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));

// Financial data for each advisor (mock data for testing)
const advisorData = {
    'Avalok': {
        portfolio: '45,00,000',
        returns: '+15.3',
        focus: 'Review ELSS for tax saving',
        nifty: '22,150 (+2.3%)',
        sensex: '73,200 (+2.1%)'
    },
    'Shruti': {
        portfolio: '32,00,000',
        returns: '+12.8',
        focus: 'Rebalance equity allocation',
        nifty: '22,150 (+2.3%)',
        sensex: '73,200 (+2.1%)'
    },
    'Vidyadhar': {
        portfolio: '68,00,000',
        returns: '+18.5',
        focus: 'Consider debt fund switch',
        nifty: '22,150 (+2.3%)',
        sensex: '73,200 (+2.1%)'
    }
};

async function sendMediaTemplate(subscriber) {
    const data = advisorData[subscriber.name] || advisorData['Avalok'];
    
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: subscriber.phone.replace('+', ''),
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
                            link: 'https://storage.googleapis.com/msgsndr/0iO3mS8O2ALqgGWCZXm0/media/676be3f81444e55f9d0e8b84.png'
                        }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: subscriber.name },           // {{1}} - Name
                        { type: 'text', text: data.portfolio },            // {{2}} - Portfolio Value
                        { type: 'text', text: data.returns },              // {{3}} - Returns %
                        { type: 'text', text: data.focus },                // {{4}} - Today's Focus
                        { type: 'text', text: data.nifty },                // {{5}} - Nifty
                        { type: 'text', text: data.sensex }                // {{6}} - Sensex
                    ]
                }
            ]
        }
    };

    try {
        console.log(`   📤 Sending to ${subscriber.name}...`);
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            console.log(`   ✅ SUCCESS! Message ID: ${response.data.messages[0].id}`);
            return {
                success: true,
                wamid: response.data.messages[0].id,
                contact: response.data.contacts?.[0]
            };
        }
    } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.data?.error?.message || error.message}`);
        
        // If media template fails, try text template
        return sendTextTemplateFallback(subscriber);
    }
}

async function sendTextTemplateFallback(subscriber) {
    const data = advisorData[subscriber.name] || advisorData['Avalok'];
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    
    const payload = {
        messaging_product: 'whatsapp',
        to: subscriber.phone.replace('+', ''),
        type: 'template',
        template: {
            name: 'finadvise_daily_notification_v1757563710819',
            language: { code: 'en' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: subscriber.name },           // {{1}} - Name
                        { type: 'text', text: today },                     // {{2}} - Date
                        { type: 'text', text: data.portfolio },            // {{3}} - Portfolio
                        { type: 'text', text: data.returns.replace('+', '') }, // {{4}} - Returns
                        { type: 'text', text: data.focus }                 // {{5}} - Action
                    ]
                }
            ]
        }
    };

    try {
        console.log(`   🔄 Trying text template fallback...`);
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.messages?.[0]?.id) {
            console.log(`   ✅ Text template sent! ID: ${response.data.messages[0].id}`);
            return {
                success: true,
                wamid: response.data.messages[0].id,
                channel: 'text_template'
            };
        }
    } catch (error) {
        console.log(`   ❌ Text template also failed: ${error.response?.data?.error?.message || error.message}`);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

async function main() {
    console.log('\n🚀 FinAdvise WhatsApp Delivery - Production Test');
    console.log('='.repeat(60));
    console.log('\n📊 Sending personalized financial updates to advisors...\n');

    const results = [];

    for (const subscriber of subscriberData.subscribers) {
        console.log(`\n👤 ${subscriber.name} (${subscriber.phone})`);
        console.log('-'.repeat(40));
        
        const result = await sendMediaTemplate(subscriber);
        
        results.push({
            name: subscriber.name,
            phone: subscriber.phone,
            segment: subscriber.segment,
            ...result
        });

        // Delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 DELIVERY REPORT');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\nDelivered to:');
        successful.forEach(r => {
            console.log(`  • ${r.name} (${r.segment})`);
            console.log(`    Message ID: ${r.wamid}`);
            console.log(`    Channel: ${r.channel || 'media_template'}`);
        });
    }
    
    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        failed.forEach(r => {
            console.log(`  • ${r.name}: ${r.error}`);
        });
    }

    // Save detailed results
    const timestamp = Date.now();
    const resultsFile = `advisor-delivery-${timestamp}.json`;
    
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            success_rate: `${((successful.length / results.length) * 100).toFixed(1)}%`
        },
        results: results,
        templates_used: {
            media: 'finadvise_daily_v1757531949615',
            text_fallback: 'finadvise_daily_notification_v1757563710819'
        }
    }, null, 2));
    
    console.log(`\n📁 Detailed results saved to: ${resultsFile}`);
    
    console.log('\n✨ DELIVERY COMPLETE!');
    console.log('\nPlease check:');
    console.log('1. WhatsApp on advisor phones for message delivery');
    console.log('2. Image display in the media template');
    console.log('3. The results file for message IDs and details');
}

// Run the delivery
main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});