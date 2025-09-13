const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

console.log('🚀 BUTTON-FIXED WEBHOOK');
console.log('📱 Phone Number ID:', CONFIG.phoneNumberId);

// Media content
const MEDIA_URLS = {
    marketChart: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format',
    stockAnalysis: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format',
    portfolioChart: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop&auto=format',
    investmentTrends: 'https://images.unsplash.com/photo-1643208589889-0735ad7218f0?w=800&h=600&fit=crop&auto=format'
};

const CONTENT_SEQUENCE = [
    {
        type: 'image',
        media: MEDIA_URLS.marketChart,
        caption: '📊 *TODAY\'S MARKET OVERVIEW*\n\nLive market performance and key indicators'
    },
    {
        type: 'text',
        message: `🔍 *MARKET ANALYSIS - ${new Date().toLocaleDateString()}*

📈 *EQUITY MARKETS:*
• Nifty 50: 19,875 (+1.2%) ↗️
• Sensex: 65,432 (+0.9%) ↗️
• Bank Nifty: 44,250 (+1.5%) ↗️

💎 *TOP STOCK PICKS:*
1️⃣ *HDFC Bank* - Target: ₹1,750 (Buy)
2️⃣ *Reliance Industries* - Target: ₹2,950 (Hold)
3️⃣ *TCS* - Target: ₹3,850 (Strong Buy)

🎯 *Conviction Picks with 15-20% upside potential*`
    },
    {
        type: 'image',
        media: MEDIA_URLS.portfolioChart,
        caption: '💼 *PORTFOLIO ALLOCATION STRATEGY*\n\nRecommended asset distribution for optimal returns'
    },
    {
        type: 'text',
        message: `💡 *INVESTMENT STRATEGY & TIPS*

✅ *RECOMMENDED ALLOCATION:*
• Large Cap: 50%
• Mid Cap: 25% 
• Small Cap: 15%
• Debt: 10%

⚠️ *RISK FACTORS:*
• Global volatility
• Rising rates

🚀 *ACTION ITEMS:*
• Book profits in overvalued stocks
• Accumulate quality on dips
• Maintain 15% cash

📱 *Share with your clients!*`
    },
    {
        type: 'image',
        media: MEDIA_URLS.investmentTrends,
        caption: '📈 *SECTORAL OPPORTUNITIES*\n\nEmerging trends and growth sectors'
    },
    {
        type: 'text',
        message: `🌟 *SECTORAL INSIGHTS*

🔥 *HOT SECTORS:*
• IT Services (Export growth)
• Banking (NIM expansion)
• Pharma (Global demand)

📞 *NEXT STEPS:*
1. Review client portfolios
2. Rebalance allocations
3. Schedule client calls

*Happy Investing! 🎯*

_Powered by FinAdvise AI_`
    }
];

async function sendMessage(to, content) {
    try {
        let payload;
        
        if (content.type === 'text') {
            payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: content.message }
            };
        } else if (content.type === 'image') {
            payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: content.media,
                    caption: content.caption
                }
            };
        }
        
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ ${content.type} sent! ID:`, response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error(`   ❌ ${content.type} failed:`, error.response?.data?.error?.message || error.message);
        return false;
    }
}

async function sendFullContent(to) {
    console.log(`   📤 Delivering ${CONTENT_SEQUENCE.length} messages...`);
    
    for (let i = 0; i < CONTENT_SEQUENCE.length; i++) {
        const content = CONTENT_SEQUENCE[i];
        console.log(`   📦 Sending ${i + 1}/${CONTENT_SEQUENCE.length}: ${content.type}`);
        
        await sendMessage(to, content);
        
        // Wait between messages
        if (i < CONTENT_SEQUENCE.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('   ✨ Complete content delivered!\n');
}

app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && 
        req.query['hub.verify_token'] === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    res.sendStatus(200);
    
    console.log('\n📥 Webhook received at', new Date().toLocaleTimeString());
    
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    
    if (message) {
        const from = message.from;
        
        // Handle button clicks - FIXED: Check for both "button" and "interactive" types
        if ((message.type === 'button' && message.button) || 
            (message.type === 'interactive' && message.interactive?.type === 'button_reply')) {
            
            let buttonText;
            if (message.type === 'button') {
                buttonText = message.button.text;
            } else {
                buttonText = message.interactive.button_reply.title;
            }
            
            console.log(`\n🔘 BUTTON CLICKED by ${from}`);
            console.log(`   Button text: "${buttonText}"`);
            console.log(`   Message type: ${message.type}`);
            console.log(`   Time: ${new Date().toLocaleTimeString()}`);
            
            // Send full content regardless of button text
            if (buttonText && buttonText.toLowerCase().includes('retrieve')) {
                await sendFullContent(from);
            } else {
                console.log('   ⚠️  Button text did not match, sending anyway...');
                await sendFullContent(from);
            }
            
        } else if (message.type === 'text') {
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`\n💬 Text: "${text}"`);
            
            if (text.includes('content') || text.includes('retrieve')) {
                await sendFullContent(from);
            } else {
                await sendMessage(from, {
                    type: 'text',
                    message: "👋 Welcome! Click 'Retrieve Content' for market insights!"
                });
            }
        } else {
            console.log('   ℹ️  Non-message event (status update)');
        }
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        type: 'Button-Fixed Handler',
        contentItems: CONTENT_SEQUENCE.length,
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ Ready for button clicks (FIXED)');
    console.log(`🎬 Content: ${CONTENT_SEQUENCE.length} messages`);
});