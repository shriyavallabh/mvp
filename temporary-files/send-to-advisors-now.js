#!/usr/bin/env node

/**
 * Send Messages to Advisors NOW
 * Immediate execution script
 */

const axios = require('axios');

// VM webhook endpoint
const VM_URL = 'http://143.110.191.97:5001';

// Your 3 advisors with messages
const ADVISORS = [
    {
        name: 'Shruti Petkar',
        phone: '919673758777',
        message: `Dear Shruti,

📊 *Family Financial Planning Update - ${new Date().toLocaleDateString('en-IN')}*

*Today's Wealth Building Tip:*
Start a monthly SIP of ₹5,000 in a balanced fund. With an expected 12% annual return, this could grow to ₹25 lakhs in 15 years!

*3 Steps to Financial Security:*
1️⃣ Emergency Fund: Save 6 months of expenses
2️⃣ Term Insurance: Get coverage of 10x annual income
3️⃣ Child Education: Start a dedicated SIP today

*Market Update:* Sensex up 1.2% - excellent time to review your portfolio.

*Action Item:* Schedule a 15-minute call to discuss your family's financial goals.

Best regards,
Your Financial Advisor

_Mutual funds are subject to market risks. Read all scheme-related documents carefully._`
    },
    {
        name: 'Shri Avalok Petkar',
        phone: '919765071249',
        message: `Dear Avalok,

📈 *Business Growth Investment Strategy - ${new Date().toLocaleDateString('en-IN')}*

*Exclusive Insights for Entrepreneurs:*

As a business owner, your investment strategy should complement your business goals while providing diversification.

*Smart Allocation Strategy:*
✅ 30% in Equity Mutual Funds (for growth)
✅ 30% in ELSS (tax saving up to ₹46,800/year)
✅ 20% in Debt Funds (stability)
✅ 20% in Liquid Funds (opportunities)

*Market Opportunity:* Mid-cap funds showing 18% CAGR - perfect for growth-focused investors.

*Tax Tip:* Invest ₹1.5 lakhs in ELSS before March 31st to save maximum tax.

Ready to build wealth beyond your business?

Best regards,
Your Investment Partner

_Investment in securities market are subject to market risks._`
    },
    {
        name: 'Vidyadhar Petkar',
        phone: '918975758513',
        message: `Dear Vidyadhar,

🛡️ *Secure Retirement Planning Update - ${new Date().toLocaleDateString('en-IN')}*

*Your Retirement Income Strategy:*

Preserving capital while generating regular income is our priority.

*Recommended Portfolio:*
• Senior Citizen Savings Scheme: 8.2% guaranteed returns
• Post Office Monthly Income Scheme: 7.4% + bonus
• Debt Mutual Funds: 7-9% with tax efficiency
• Bank FDs: 7% (quarterly interest option)

*New Benefits for Senior Citizens:*
- Tax deduction limit increased to ₹50,000 on interest income
- Higher TDS threshold of ₹50,000
- No tax on interest up to ₹50,000

*SWP Strategy:* Withdraw ₹30,000/month from debt funds without touching principal.

*Health Insurance Tip:* Enhance coverage before age 65 for better premiums.

Would you like a personalized retirement income plan?

Warm regards,
Your Retirement Planning Advisor

_Please read all documents carefully before investing._`
    }
];

async function sendMessages() {
    console.log('================================================');
    console.log('SENDING MESSAGES TO YOUR 3 ADVISORS');
    console.log('================================================');
    console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log('');

    // First check if webhook is running
    try {
        const health = await axios.get(`${VM_URL}/health`);
        console.log('✅ Webhook server is running');
        console.log(`   Status: ${health.data.status}`);
        console.log('');
    } catch (error) {
        console.log('⚠️  Warning: Cannot reach webhook server');
        console.log('   Will show messages locally instead');
        console.log('');
    }

    // Send messages
    for (const advisor of ADVISORS) {
        console.log(`📱 Sending to ${advisor.name} (${advisor.phone})...`);
        
        try {
            // Try to send via webhook
            const response = await axios.post(`${VM_URL}/send`, {
                phone: advisor.phone,
                message: advisor.message,
                advisor_name: advisor.name
            }, {
                timeout: 5000
            });
            
            if (response.data.success) {
                console.log(`   ✅ Message queued successfully`);
                console.log(`   Message ID: ${response.data.messageId}`);
                console.log(`   Status: ${response.data.status}`);
            }
            
        } catch (error) {
            console.log(`   ⚠️  Webhook not available, showing message:`);
            console.log('   ' + '─'.repeat(50));
            console.log(advisor.message.split('\n').map(line => '   ' + line).join('\n'));
            console.log('   ' + '─'.repeat(50));
        }
        
        console.log('');
        
        // Wait 2 seconds between messages
        if (ADVISORS.indexOf(advisor) < ADVISORS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('================================================');
    console.log('SUMMARY');
    console.log('================================================');
    console.log('');
    console.log('Messages have been prepared for:');
    console.log('1. Shruti Petkar - Family Financial Planning');
    console.log('2. Shri Avalok Petkar - Business Investment Strategy');
    console.log('3. Vidyadhar Petkar - Retirement Planning');
    console.log('');
    
    // Check service status
    try {
        const status = await axios.get(`${VM_URL}/status`);
        console.log('WhatsApp Service Status:');
        console.log(`  Queue Length: ${status.data.whatsapp.queueLength}`);
        console.log(`  Messages Sent: ${status.data.whatsapp.stats.sent}`);
        console.log(`  Messages Failed: ${status.data.whatsapp.stats.failed}`);
    } catch (error) {
        // Service not available
    }
    
    console.log('');
    console.log('To verify delivery:');
    console.log('1. Check WhatsApp on advisor phones');
    console.log('2. Check VM logs: pm2 logs whatsapp-webhook');
    console.log('3. Check message logs: /home/mvp/logs/whatsapp/');
}

// Run immediately
if (require.main === module) {
    sendMessages().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}

module.exports = { ADVISORS, sendMessages };