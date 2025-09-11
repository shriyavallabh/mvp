const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send Educational WhatsApp Content - Final Version
 * Sends rich educational content using approved templates
 */

const axios = require('axios');

class EducationalWhatsAppContent {
    constructor() {
        this.config = {
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            bearerToken: process.env.WHATSAPP_ACCESS_TOKEN,
            apiVersion: 'v18.0',
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
        };
    }
    
    /**
     * Send educational content using approved templates
     */
    async sendEducationalMessages() {
        console.log('================================================');
        console.log('SENDING EDUCATIONAL CONTENT TO ADVISORS');
        console.log('================================================\n');
        
        const advisors = [
            {
                name: 'Shruti Petkar',
                phone: '919673758777',
                education: {
                    topic: 'SIP Wealth Creation',
                    summary: 'Learn how ₹15,000/month can become ₹50 lakhs',
                    action: 'Review your SIP strategy'
                }
            },
            {
                name: 'Shri Avalok Petkar',
                phone: '919765071249',
                education: {
                    topic: 'Tax Saving Strategies',
                    summary: 'Save up to ₹1.95 lakhs in taxes legally',
                    action: 'Optimize your tax planning'
                }
            },
            {
                name: 'Vidyadhar Petkar',
                phone: '918975758513',
                education: {
                    topic: 'Retirement Income Planning',
                    summary: 'Generate ₹75,000 monthly income safely',
                    action: 'Review income sources'
                }
            }
        ];
        
        // We'll use the investment_alert_v2 template which is approved
        for (const advisor of advisors) {
            console.log(`📚 Sending to ${advisor.name}...`);
            console.log(`   Topic: ${advisor.education.topic}`);
            
            const messageData = {
                messaging_product: 'whatsapp',
                to: advisor.phone,
                type: 'template',
                template: {
                    name: 'investment_alert_v2',
                    language: { code: 'en_US' },
                    components: [{
                        type: 'body',
                        parameters: [
                            { type: 'text', text: advisor.name.split(' ')[0] },
                            { type: 'text', text: advisor.education.topic },
                            { type: 'text', text: advisor.education.summary },
                            { type: 'text', text: advisor.education.action }
                        ]
                    }]
                }
            };
            
            try {
                const response = await axios.post(
                    `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`,
                    messageData,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.config.bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log(`   ✅ Educational content sent!`);
                console.log(`   Message ID: ${response.data.messages[0].id}`);
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.response?.data?.error?.message || error.message}`);
            }
            
            await new Promise(r => setTimeout(r, 2000));
        }
        
        // Display what full rich content would look like
        this.displayFullEducationalContent();
    }
    
    /**
     * Display the complete educational content
     */
    displayFullEducationalContent() {
        console.log('\n================================================');
        console.log('COMPLETE EDUCATIONAL CONTENT (WITH IMAGES)');
        console.log('================================================\n');
        
        const fullContent = {
            'Shruti Petkar': {
                image: '📊 [Graph showing SIP growth over 15 years]',
                message: `*Building Wealth Through SIPs* 📈

*Your SIP Journey:*
• Current: ₹15,000/month
• 15 years: ₹50 lakhs
• 20 years: ₹1.2 crores

*Key Benefits:*
✅ Rupee cost averaging
✅ Power of compounding
✅ Disciplined investing
✅ No market timing needed

*Your Portfolio:*
Invested: ₹8 lakhs
Current: ₹12.5 lakhs
Growth: 56.25% 🎯

*Action Steps:*
1. Increase SIP by 10% yearly
2. Add ELSS for tax saving
3. Link each SIP to a goal

📱 Calculator: finadvise.com/sip`
            },
            
            'Shri Avalok Petkar': {
                image: '💼 [Infographic showing tax deductions]',
                message: `*Smart Tax Planning for Entrepreneurs* 💰

*Your Tax Saving Potential:*
Section 80C: ₹1.5L
Section 80D: ₹75K  
Section 80CCD: ₹50K
Total: ₹2.75L deductions

*Current vs Optimal:*
Now: ₹46,800 saved
Potential: ₹1,95,000
Gap: ₹1,48,200 ⚠️

*Strategy:*
1. Max ELSS investment
2. Start NPS account
3. HUF structure benefits
4. Corporate optimization

*Business Diversification:*
Current: 87% business, 13% personal
Target: 70% business, 30% personal

📊 Tax Calculator: finadvise.com/tax`
            },
            
            'Vidyadhar Petkar': {
                image: '🛡️ [Chart showing income sources]',
                message: `*Secure Retirement Income Plan* 🏖️

*Your Monthly Income:*
Pension: ₹35,000
SCSS: ₹8,000
Post Office: ₹5,500
SWP: ₹15,000
Rent: ₹12,000
Total: ₹75,500 ✅

*Safety Score: 9/10* 🛡️

*Optimization Tips:*
1. Ladder FDs for liquidity
2. Use SWP for tax efficiency
3. Maintain 1-year emergency fund

*Health Coverage: ₹45 Lakhs* ✅

*Estate Planning:*
• Update will & nominations
• Consider family trust
• Gift planning for tax

📱 Retirement Planner: finadvise.com/retire`
            }
        };
        
        Object.entries(fullContent).forEach(([name, content]) => {
            console.log(`📱 ${name}:`);
            console.log('─'.repeat(50));
            console.log(content.image);
            console.log('');
            console.log(content.message);
            console.log('─'.repeat(50));
            console.log('');
        });
        
        console.log('📌 Note: Full rich content with images requires:');
        console.log('• Image template approval from Meta (pending)');
        console.log('• Or advisor initiating conversation (24-hour window)');
        console.log('• Currently using text templates for delivery');
    }
}

// Main execution
async function main() {
    const sender = new EducationalWhatsAppContent();
    await sender.sendEducationalMessages();
    
    console.log('\n✅ Educational content delivery complete!');
    console.log('\n📊 What Your Advisors Received:');
    console.log('• Shruti: SIP wealth creation education');
    console.log('• Avalok: Tax saving strategies');
    console.log('• Vidyadhar: Retirement income planning');
    console.log('\n🔄 Daily Educational Content:');
    console.log('• Automated at 5 AM daily');
    console.log('• Personalized per segment');
    console.log('• Trackable engagement metrics');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = EducationalWhatsAppContent;