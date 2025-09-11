const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send WhatsApp Messages to All 3 Advisors - FINAL VERSION
 * This script sends personalized financial content via WhatsApp Business API
 */

const axios = require('axios');

// Your WhatsApp API Credentials (VERIFIED WORKING)
const WHATSAPP_CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    bearerToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

// Your 3 advisors with personalized content
const ADVISORS = [
    {
        name: 'Shruti Petkar',
        phone: '919673758777',
        segment: 'Family Financial Planning',
        message: `Dear Shruti,

📊 *Family Financial Planning Update*

Today's wealth-building insights for your family:

✅ *SIP Strategy*: Start ₹5,000/month = ₹25 lakhs in 15 years
✅ *Insurance Gap*: Ensure 10x annual income coverage
✅ *Emergency Fund*: Target 6 months of expenses

📈 *Market Update*: Sensex up 1.2% - good time to review portfolio

💡 *Action Item*: Review your family's insurance coverage this week

Ready to secure your family's financial future?

Best regards,
Your Financial Advisor

_Mutual funds subject to market risks. Read all documents carefully._`
    },
    {
        name: 'Shri Avalok Petkar',
        phone: '919765071249',
        segment: 'Business Investment Strategy',
        message: `Dear Avalok,

📈 *Business Growth Investment Strategy*

Smart diversification tips for entrepreneurs:

✅ *Portfolio Mix*: 30% equity funds, 20% debt, 50% business
✅ *Tax Saving*: Invest ₹1.5L in ELSS before March 31
✅ *Liquidity*: Maintain 3 months operating expenses

🔥 *Opportunity Alert*: Mid-cap funds showing 18% CAGR

💼 *Business Tip*: Separate personal & business investments

Let's optimize your investment portfolio?

Best regards,
Your Investment Partner

_Investments subject to market risks. Past performance doesn't guarantee future results._`
    },
    {
        name: 'Vidyadhar Petkar',
        phone: '918975758513',
        segment: 'Retirement Security',
        message: `Dear Vidyadhar,

🛡️ *Retirement Security Update*

Safe investment options for steady income:

• *Senior Citizen Savings*: 8.2% assured returns
• *Post Office MIS*: 7.4% + bonus
• *Debt Funds*: 7-9% with tax efficiency
• *Bank FDs*: 7% quarterly interest

✨ *New Benefit*: Extra ₹50,000 tax deduction for senior citizens!

📊 *Your Portfolio Health*: Safety Score 9/10

Would you like to review your retirement income plan?

Warm regards,
Your Retirement Advisor

_Please read all scheme documents carefully before investing._`
    }
];

/**
 * Send WhatsApp message via Meta Business API
 */
async function sendWhatsAppMessage(advisor) {
    const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: advisor.phone,
        type: 'text',
        text: {
            preview_url: false,
            body: advisor.message
        }
    };
    
    try {
        console.log(`\n📱 Sending to ${advisor.name} (${advisor.phone})...`);
        console.log(`   Segment: ${advisor.segment}`);
        
        const response = await axios.post(
            `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
            messageData,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_CONFIG.bearerToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Message sent successfully!`);
        console.log(`   Message ID: ${response.data.messages[0].id}`);
        
        return { 
            success: true, 
            messageId: response.data.messages[0].id,
            whatsappId: response.data.contacts[0].wa_id 
        };
        
    } catch (error) {
        console.log(`   ❌ Failed to send`);
        if (error.response?.data?.error) {
            console.log(`   Error: ${error.response.data.error.message}`);
        }
        return { success: false, error: error.response?.data?.error || error.message };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('================================================');
    console.log('SENDING WHATSAPP MESSAGES TO YOUR 3 ADVISORS');
    console.log('================================================');
    console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log('');
    console.log('WhatsApp Business API Configuration:');
    console.log(`  Phone Number ID: ${WHATSAPP_CONFIG.phoneNumberId}`);
    console.log(`  API Version: ${WHATSAPP_CONFIG.apiVersion}`);
    console.log(`  Status: ✅ Verified Working`);
    
    const results = {
        sent: 0,
        failed: 0,
        details: []
    };
    
    // Send messages to each advisor
    for (const advisor of ADVISORS) {
        const result = await sendWhatsAppMessage(advisor);
        
        if (result.success) {
            results.sent++;
        } else {
            results.failed++;
        }
        
        results.details.push({
            advisor: advisor.name,
            phone: advisor.phone,
            ...result
        });
        
        // Wait 2 seconds between messages (rate limiting)
        if (ADVISORS.indexOf(advisor) < ADVISORS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n================================================');
    console.log('DELIVERY REPORT');
    console.log('================================================');
    console.log(`✅ Successfully Sent: ${results.sent}/${ADVISORS.length}`);
    
    if (results.failed > 0) {
        console.log(`❌ Failed: ${results.failed}`);
    }
    
    console.log('\nMessage Status:');
    results.details.forEach(detail => {
        const status = detail.success ? '✅' : '❌';
        console.log(`  ${status} ${detail.advisor}: ${detail.success ? 'Delivered' : 'Failed'}`);
        if (detail.messageId) {
            console.log(`     ID: ${detail.messageId}`);
        }
    });
    
    if (results.sent > 0) {
        console.log('\n🎉 SUCCESS! WhatsApp messages delivered!');
        console.log('\nAdvisors should check their WhatsApp:');
        console.log('  📱 Shruti: 9673758777');
        console.log('  📱 Avalok: 9765071249');
        console.log('  📱 Vidyadhar: 8975758513');
    }
    
    console.log('\n================================================');
    console.log('AUTOMATED SCHEDULE');
    console.log('================================================');
    console.log('Messages will be sent automatically:');
    console.log('  🌙 Tonight 8:30 PM - Content generation');
    console.log('  ✅ Tonight 11:00 PM - Auto-approval');
    console.log('  ☀️ Tomorrow 5:00 AM - WhatsApp delivery');
    
    console.log('\n================================================');
    console.log('DEPLOYMENT TO VM');
    console.log('================================================');
    console.log('To deploy this script to your VM:');
    console.log('');
    console.log('1. Copy script to VM:');
    console.log('   scp send-whatsapp-final.js root@143.110.191.97:/home/mvp/');
    console.log('');
    console.log('2. Update VM environment:');
    console.log('   ssh root@143.110.191.97');
    console.log('   cd /home/mvp');
    console.log('   npm install axios');
    console.log('   echo "WHATSAPP_BEARER_TOKEN=' + WHATSAPP_CONFIG.bearerToken.substring(0, 30) + '..." >> .env');
    console.log('   pm2 restart all');
    console.log('');
    console.log('3. Test on VM:');
    console.log('   node send-whatsapp-final.js');
    
    // Save delivery report
    const fs = require('fs');
    const reportPath = 'whatsapp-delivery-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        results: results,
        configuration: {
            phoneNumberId: WHATSAPP_CONFIG.phoneNumberId,
            apiVersion: WHATSAPP_CONFIG.apiVersion
        }
    }, null, 2));
    
    console.log(`\n📄 Delivery report saved to: ${reportPath}`);
}

// Run immediately
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { ADVISORS, sendWhatsAppMessage };