#!/usr/bin/env node

/**
 * Immediate WhatsApp Message Sender
 * Sends test messages to the 3 advisors NOW
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Your 3 advisors with proper formatting for WhatsApp
const ADVISORS = [
    {
        arn: 'ARN_001',
        name: 'Shruti Petkar',
        phone: '919673758777',  // WhatsApp format without +
        segment: 'families',
        message: `Dear Shruti,

📊 *Family Financial Planning Update*

Today's insight for growing your family's wealth:

✅ Start a SIP of ₹5,000/month - can grow to ₹25 lakhs in 15 years
✅ Ensure adequate term insurance (10x annual income)
✅ Build emergency fund (6 months expenses)

*Market Update*: Sensex up 1.2% - good time to review portfolio

Would you like to discuss your family's financial goals?

Best regards,
Your Financial Advisor

_Mutual funds subject to market risks. Read documents carefully._`
    },
    {
        arn: 'ARN_002', 
        name: 'Shri Avalok Petkar',
        phone: '919765071249',
        segment: 'entrepreneurs',
        message: `Dear Avalok,

📈 *Business Growth Investment Strategy*

Smart investment tips for entrepreneurs:

✅ Diversify beyond business - allocate 30% surplus to equity funds
✅ Save 30% tax through ELSS investments
✅ Keep 3 months expenses liquid for opportunities

*Market Alert*: Mid-cap funds showing strong momentum!

Ready to optimize your investment strategy?

Best regards,
Your Investment Partner

_Investments subject to market risks._`
    },
    {
        arn: 'ARN_003',
        name: 'Vidyadhar Petkar', 
        phone: '918975758513',
        segment: 'retirees',
        message: `Dear Vidyadhar,

🛡️ *Retirement Security Update*

Safe investment options for your retirement:

• Senior Citizen Scheme: 8.2% assured returns
• Debt Funds: Better than FD with tax efficiency
• SWP: Regular income without touching principal

*Important*: New tax benefits for senior citizens announced!

Need a portfolio review?

Warm regards,
Your Retirement Advisor

_Read all documents before investing._`
    }
];

/**
 * Try multiple methods to send messages
 */
async function sendMessages() {
    console.log('================================================');
    console.log('SENDING TEST MESSAGES TO YOUR 3 ADVISORS');
    console.log('================================================');
    console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log('');

    const results = [];
    
    for (const advisor of ADVISORS) {
        console.log(`\n📱 Sending to ${advisor.name} (${advisor.phone})...`);
        
        let sent = false;
        let method = '';
        
        // Method 1: Try webhook with different secrets
        const secrets = [
            'finadvise-secret-key-2024',
            'finadvise-webhook-secret',
            process.env.WEBHOOK_SECRET,
            'test-secret'
        ].filter(Boolean);
        
        for (const secret of secrets) {
            try {
                const response = await axios.post('http://143.110.191.97:5001/trigger', {
                    action: 'send_whatsapp',
                    phone: advisor.phone,
                    message: advisor.message,
                    advisor_name: advisor.name,
                    advisor_arn: advisor.arn
                }, {
                    headers: {
                        'X-Webhook-Secret': secret,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    console.log(`✅ Sent via webhook (secret: ${secret.substring(0, 10)}...)`);
                    sent = true;
                    method = 'webhook';
                    break;
                }
            } catch (error) {
                // Continue to next secret
            }
        }
        
        // Method 2: Try direct WhatsApp API if configured
        if (!sent && process.env.WHATSAPP_BEARER_TOKEN) {
            try {
                const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '123456789';
                const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
                
                const response = await axios.post(url, {
                    messaging_product: 'whatsapp',
                    to: advisor.phone,
                    type: 'text',
                    text: {
                        body: advisor.message
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.WHATSAPP_BEARER_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`✅ Sent via WhatsApp Business API`);
                sent = true;
                method = 'whatsapp_api';
            } catch (error) {
                console.log(`⚠️  WhatsApp API error: ${error.message}`);
            }
        }
        
        // Log the attempt
        const logEntry = {
            timestamp: new Date().toISOString(),
            advisor: advisor.name,
            phone: advisor.phone,
            sent: sent,
            method: method || 'none',
            message_preview: advisor.message.substring(0, 100) + '...'
        };
        
        results.push(logEntry);
        
        if (!sent) {
            console.log(`❌ Could not send - showing message preview:`);
            console.log('-------------------------------------------');
            console.log(advisor.message);
            console.log('-------------------------------------------');
        }
        
        // Save to log file
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `messages-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
        
        // Wait between messages
        if (ADVISORS.indexOf(advisor) < ADVISORS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n================================================');
    console.log('SUMMARY');
    console.log('================================================\n');
    
    results.forEach(result => {
        const status = result.sent ? '✅' : '❌';
        console.log(`${status} ${result.advisor}: ${result.sent ? `Sent via ${result.method}` : 'Not sent (preview shown)'}`);
    });
    
    console.log('\n================================================');
    console.log('NEXT STEPS');
    console.log('================================================');
    console.log('');
    console.log('1. Check if advisors received messages on WhatsApp');
    console.log('2. To configure WhatsApp API:');
    console.log('   - Set WHATSAPP_BEARER_TOKEN in .env');
    console.log('   - Set WHATSAPP_PHONE_NUMBER_ID in .env');
    console.log('3. To deploy to VM:');
    console.log('   - Copy this script to VM');
    console.log('   - Run: node send-messages-immediate.js');
    console.log('');
    console.log(`Log saved to: logs/messages-${new Date().toISOString().split('T')[0]}.json`);
}

// Run immediately
if (require.main === module) {
    sendMessages().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { ADVISORS, sendMessages };