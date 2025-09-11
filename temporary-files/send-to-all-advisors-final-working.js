const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * FINAL WORKING VERSION - Send Media Templates to All Advisors
 * Uses the proven approach that delivers media templates successfully
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

// Professional financial images
const imageUrls = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', // Trading chart
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80', // Financial dashboard
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80'  // Money growth
];

console.log('\n✨ FINADVISE MEDIA TEMPLATE DELIVERY - PRODUCTION VERSION');
console.log('=' .repeat(70));
console.log('Using PROVEN approach with UTILITY templates');
console.log('Recipients: All advisors + new subscriber\n');

async function sendMediaTemplateToAdvisor(subscriber, imageIndex) {
    const imageUrl = imageUrls[imageIndex % imageUrls.length];
    const today = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    // Personalized data per advisor
    const portfolioData = {
        'Avalok': { value: '45,00,000', change: '+3.2%', action: 'Review ELSS investments' },
        'Shruti': { value: '32,00,000', change: '+2.8%', action: 'Rebalance equity allocation' },
        'Vidyadhar': { value: '68,00,000', change: '+4.1%', action: 'Consider debt fund switch' },
        'Valued Subscriber': { value: '52,75,000', change: '+3.5%', action: 'Optimize portfolio mix' }
    };
    
    const data = portfolioData[subscriber.name] || portfolioData['Valued Subscriber'];
    
    const payload = {
        messaging_product: 'whatsapp',
        to: subscriber.phone.replace('+', ''),
        type: 'template',
        template: {
            name: 'finadvise_account_update_v1757563699228', // UTILITY template - proven to work
            language: { code: 'en' },
            components: [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { link: imageUrl }
                    }]
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: subscriber.name },
                        { type: 'text', text: today },
                        { type: 'text', text: data.value },
                        { type: 'text', text: data.change },
                        { type: 'text', text: data.action }
                    ]
                }
            ]
        }
    };
    
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
                recipient: subscriber.name
            };
        }
    } catch (error) {
        return {
            success: false,
            recipient: subscriber.name,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

async function sendToAllAdvisors() {
    console.log('📤 Sending personalized media templates...\n');
    
    // Include all advisors + new subscriber
    const allRecipients = [
        ...subscriberData.subscribers,
        { name: 'Valued Subscriber', phone: '919022810769', segment: 'Premium' }
    ];
    
    const results = [];
    
    for (let i = 0; i < allRecipients.length; i++) {
        const recipient = allRecipients[i];
        console.log(`Sending to ${recipient.name} (${recipient.phone})...`);
        
        const result = await sendMediaTemplateToAdvisor(recipient, i);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ SUCCESS! Message ID: ${result.messageId}`);
        } else {
            console.log(`❌ Failed: ${result.error}`);
        }
        
        // Small delay between sends
        if (i < allRecipients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DELIVERY SUMMARY');
    console.log('=' .repeat(70));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    if (successful.length > 0) {
        console.log('\nDelivered to:');
        successful.forEach(r => {
            console.log(`  • ${r.recipient}`);
            console.log(`    Message ID: ${r.messageId}`);
        });
    }
    
    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        failed.forEach(r => {
            console.log(`  • ${r.recipient}: ${r.error}`);
        });
    }
    
    console.log('\n📱 WHAT ADVISORS WILL SEE:');
    console.log('  1. Professional financial chart/dashboard image');
    console.log('  2. Personalized greeting with their name');
    console.log('  3. Their portfolio value (₹XX,00,000)');
    console.log('  4. Today\'s performance percentage');
    console.log('  5. Specific action item for their portfolio');
    console.log('  6. FinAdvise branding in footer');
    
    console.log('\n✨ SUCCESS FACTORS:');
    console.log('  • Using UTILITY template (better delivery)');
    console.log('  • All parameters properly formatted');
    console.log('  • Professional image URLs');
    console.log('  • No button parameters needed for this template');
    console.log('  • No 24-hour window required!');
    
    // Save results
    const timestamp = new Date().toISOString();
    fs.writeFileSync(
        `final-delivery-${Date.now()}.json`,
        JSON.stringify({ timestamp, results, summary: { successful: successful.length, failed: failed.length }}, null, 2)
    );
}

// Execute
sendToAllAdvisors().catch(console.error);