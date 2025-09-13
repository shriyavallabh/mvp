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

console.log('🚀 FULL MEDIA CONTENT WEBHOOK');
console.log('📱 Phone Number ID:', CONFIG.phoneNumberId);

// High-quality financial images
const MEDIA_URLS = {
    marketChart: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format',
    stockAnalysis: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format',
    portfolioChart: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop&auto=format',
    investmentTrends: 'https://images.unsplash.com/photo-1643208589889-0735ad7218f0?w=800&h=600&fit=crop&auto=format'
};

// Complete content sequence for button click
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
4️⃣ *ICICI Bank* - Target: ₹1,020 (Buy)

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
• Large Cap Stocks: 50%
• Mid Cap Stocks: 25%
• Small Cap Stocks: 15%
• Debt/FDs: 10%

⚠️ *KEY RISK FACTORS:*
• Global market volatility
• Rising interest rates
• Geopolitical tensions

🚀 *ACTION ITEMS FOR ADVISORS:*
• Book partial profits in overvalued stocks
• Accumulate quality stocks on dips
• Maintain 15-20% cash for opportunities
• Focus on dividend-paying stocks

📱 *Share this analysis with your clients for maximum impact!*`
    },
    {
        type: 'image',
        media: MEDIA_URLS.investmentTrends,
        caption: '📈 *SECTORAL OPPORTUNITIES*\n\nEmerging trends and growth sectors to watch'
    },
    {
        type: 'text',
        message: `🌟 *SECTORAL INSIGHTS*

🔥 *HOT SECTORS:*
• IT Services (Export growth)
• Banking (NIM expansion)
• Pharmaceuticals (Global demand)
• Infrastructure (Government push)

❄️ *AVOID FOR NOW:*
• Real Estate (High inventory)
• Metals (Commodity cycle peak)

📞 *FOLLOW-UP ACTIONS:*
1. Review client portfolios
2. Rebalance based on this analysis
3. Schedule client calls this week
4. Share sector-specific picks

*Happy Investing! 🎯*

_Powered by FinAdvise AI - Your Smart Investment Partner_`
    }
];

// Send WhatsApp message (text or media)
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

// Send complete content sequence
async function sendFullContent(to) {
    console.log(`   📤 Delivering ${CONTENT_SEQUENCE.length} messages...`);
    
    for (let i = 0; i < CONTENT_SEQUENCE.length; i++) {
        const content = CONTENT_SEQUENCE[i];
        console.log(`   📦 Sending ${i + 1}/${CONTENT_SEQUENCE.length}: ${content.type}`);
        
        const success = await sendMessage(to, content);
        
        if (success) {
            // Wait between messages to avoid spam detection
            if (i < CONTENT_SEQUENCE.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } else {
            console.log(`   ⚠️  Message ${i + 1} failed, continuing...`);
        }
    }
    
    console.log('   ✨ Complete content sequence delivered!\n');
}

// Webhook verification
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && 
        req.query['hub.verify_token'] === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// Handle incoming messages and button clicks
app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Respond immediately
    
    console.log('\n📥 Webhook event received at', new Date().toLocaleTimeString());
    console.log('Event data:', JSON.stringify(req.body, null, 2));
    
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    
    if (message) {
        const from = message.from;
        
        // Handle button clicks
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            const buttonTitle = message.interactive.button_reply.title;
            
            console.log(`\n🔘 BUTTON CLICKED by ${from}`);
            console.log(`   Button: "${buttonTitle}" (${buttonId})`);
            console.log(`   Time: ${new Date().toLocaleTimeString()}`);
            
            // Send full media content sequence
            await sendFullContent(from);
            
        } else if (message.type === 'text') {
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`\n💬 Text message from ${from}: "${text}"`);
            
            if (text.includes('content') || text.includes('unlock') || text.includes('retrieve')) {
                console.log('   📱 Keyword detected, sending full content...');
                await sendFullContent(from);
            } else {
                // Send simple welcome message
                await sendMessage(from, {
                    type: 'text',
                    message: "👋 Welcome to FinAdvise!\n\n🔘 Click 'Retrieve Content' button for:\n• 📊 Market charts\n• 📈 Stock analysis\n• 💼 Portfolio insights\n• 🎯 Investment tips\n\nOr type 'content' to get it instantly!"
                });
            }
        }
    } else {
        console.log('   ℹ️  Non-message event (probably status update)');
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        type: 'Full Media Content Handler',
        features: ['images', 'text', 'sequences'],
        contentItems: CONTENT_SEQUENCE.length,
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ Ready for button clicks');
    console.log(`🎬 Content sequence: ${CONTENT_SEQUENCE.length} messages`);
    console.log('📊 Media types: Charts, Analysis, Portfolio, Trends');
});