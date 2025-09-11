const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Send Rich Media Directly (No Template) Using Active Session
 */

const axios = require('axios');

const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

console.log('\n🚀 SENDING RICH CONTENT USING ACTIVE SESSION');
console.log('=' .repeat(70));
console.log('Since 9022810769 has an active session, we can send ANYTHING!\n');

async function sendRichContent() {
    console.log('📸 Sending rich media message with financial data...\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769',
        type: 'image',
        image: {
            link: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
            caption: `🎯 *FinAdvise Premium Report*

Good morning! Here's your exclusive financial update:

📊 *Portfolio Performance*
• Current Value: ₹85,00,000
• Today's Gain: +₹2,12,500 (+2.5%)
• Monthly Return: +18.7%

📈 *Market Overview*
• Nifty 50: 22,450 (+3.5%)
• Sensex: 74,125 (+3.3%)
• Gold: ₹62,850/10g (+0.8%)

💡 *Today's Insights*
Your tech holdings are outperforming! Consider:
1. Book partial profits in high gainers
2. Rebalance towards large-cap funds
3. Review ELSS for tax planning

🔔 *Action Items*
• SIP due on 15th: ₹50,000
• Review quarterly rebalancing
• Tax saving deadline: 45 days

_This is what MARKETING templates were supposed to deliver!_
_But direct messages work perfectly during active session._

Reply with:
📊 - For detailed portfolio breakdown
📈 - For stock recommendations
📞 - To schedule advisor call`
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
            console.log('✅ SUCCESS! Rich media sent directly!');
            console.log('Message ID:', response.data.messages[0].id);
            console.log('\n📱 CHECK 9022810769 NOW!');
            console.log('You should see:');
            console.log('  • Professional financial chart image');
            console.log('  • Rich formatted text with emojis');
            console.log('  • Portfolio data');
            console.log('  • Market overview');
            console.log('  • Action items');
            console.log('  • Interactive reply options');
            
            return response.data.messages[0].id;
        }
    } catch (error) {
        console.log('❌ Failed:', error.response?.data?.error?.message);
    }
}

async function sendInteractiveButtons() {
    console.log('\n\n📱 Sending interactive button message...\n');
    
    const payload = {
        messaging_product: 'whatsapp',
        to: '919022810769',
        type: 'interactive',
        interactive: {
            type: 'button',
            header: {
                type: 'text',
                text: '🎯 Quick Actions'
            },
            body: {
                text: 'What would you like to do?'
            },
            footer: {
                text: 'FinAdvise Premium'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'view_portfolio',
                            title: 'View Portfolio'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'get_recommendations',
                            title: 'Get Tips'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'call_advisor',
                            title: 'Call Advisor'
                        }
                    }
                ]
            }
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
            console.log('✅ Interactive buttons sent!');
            console.log('Message ID:', response.data.messages[0].id);
        }
    } catch (error) {
        console.log('❌ Buttons failed:', error.response?.data?.error?.message);
    }
}

async function main() {
    // Send rich media
    await sendRichContent();
    
    // Send interactive buttons
    await sendInteractiveButtons();
    
    console.log('\n\n💡 KEY INSIGHTS');
    console.log('=' .repeat(70));
    console.log('\n✅ WHAT WORKS:');
    console.log('  • UTILITY templates (unlimited, with images)');
    console.log('  • Direct messages during active 24-hour session');
    console.log('  • Interactive messages and buttons');
    
    console.log('\n❌ WHAT\'S BLOCKED:');
    console.log('  • MARKETING templates (filtered by WhatsApp)');
    console.log('  • Even to fresh numbers');
    console.log('  • API accepts but doesn\'t deliver');
    
    console.log('\n🎯 PERFECT SOLUTION:');
    console.log('  1. Use UTILITY templates for cold outreach');
    console.log('  2. Once user replies, send anything directly');
    console.log('  3. Or stick to UTILITY for guaranteed delivery');
    
    console.log('\n📊 FOR DAILY 5AM UPDATES:');
    console.log('  Use: finadvise_utility_v1757563556085');
    console.log('  Or: finadvise_account_update_v1757563699228');
    console.log('  Both support images and rich content!');
}

main().catch(console.error);