const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556', // Correct Phone Number ID from Meta
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

console.log('🚀 WEBHOOK WITH MEDIA CONTENT DELIVERY');
console.log('📱 Phone Number ID:', CONFIG.phoneNumberId);

// Media content URLs (use publicly accessible URLs)
const MEDIA_LIBRARY = {
    marketChart: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    portfolio: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
    analysis: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800'
};

// Content to deliver when button is clicked
const CONTENT_RESPONSES = {
    'RETRIEVE_CONTENT': {
        messages: [
            {
                type: 'image',
                url: MEDIA_LIBRARY.marketChart,
                caption: '📊 Today\'s Market Performance Chart'
            },
            {
                type: 'text',
                content: `🔍 *MARKET ANALYSIS - ${new Date().toLocaleDateString()}*

📈 *EQUITY MARKETS:*
• Nifty 50: 19,875 (+1.2%) ↗️
• Sensex: 65,432 (+0.9%) ↗️
• Bank Nifty: 44,250 (+1.5%) ↗️

💎 *TOP PICKS TODAY:*
1️⃣ *HDFC Bank* - Target: ₹1,750
2️⃣ *Reliance* - Target: ₹2,950
3️⃣ *TCS* - Target: ₹3,850

📱 Share with your clients now!`
            },
            {
                type: 'image',
                url: MEDIA_LIBRARY.portfolio,
                caption: '💼 Recommended Portfolio Allocation'
            },
            {
                type: 'text',
                content: `💡 *INVESTMENT STRATEGY:*

✅ *Allocation Suggested:*
• Large Cap: 50%
• Mid Cap: 30%
• Debt: 20%

⚠️ *Risk Factors:*
• Global uncertainty
• FII selling pressure

🎯 *Action Items:*
• Book profits in overvalued stocks
• Accumulate quality names on dips

_Powered by FinAdvise AI_`
            }
        ]
    },
    'UNLOCK_CONTENT': {
        messages: [
            {
                type: 'text',
                content: '🔓 *Premium Content Unlocked!*\n\nAccess your exclusive analysis below:'
            },
            {
                type: 'image',
                url: MEDIA_LIBRARY.analysis,
                caption: '📈 Technical Analysis Chart'
            }
        ]
    }
};

// Send WhatsApp message (text or media)
async function sendWhatsAppContent(to, messageData) {
    try {
        let payload;
        
        if (messageData.type === 'text') {
            payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: messageData.content }
            };
        } else if (messageData.type === 'image') {
            payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: messageData.url,
                    caption: messageData.caption
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
        
        console.log('   ✅ Content sent:', messageData.type, 'ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('   ❌ Failed to send:', error.response?.data?.error?.message || error.message);
        
        // Log full error for debugging
        if (error.response?.data) {
            console.error('   Full error:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// Send multiple messages in sequence
async function sendContentSequence(to, buttonId) {
    const contentSet = CONTENT_RESPONSES[buttonId] || CONTENT_RESPONSES['RETRIEVE_CONTENT'];
    
    console.log(`   📤 Sending ${contentSet.messages.length} messages...`);
    
    for (const message of contentSet.messages) {
        await sendWhatsAppContent(to, message);
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('   ✨ All content delivered!\n');
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
            
            console.log(`\n🔘 Button clicked by ${from}`);
            console.log(`   Button: "${buttonTitle}" (${buttonId})`);
            
            // Send content sequence (images + text)
            await sendContentSequence(from, buttonId);
            
        } else if (message.type === 'text') {
            // Handle text messages
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`\n💬 Text from ${from}: "${text}"`);
            
            if (text.includes('content') || text.includes('unlock') || text.includes('retrieve')) {
                // Send content if they type content-related keywords
                await sendContentSequence(from, 'RETRIEVE_CONTENT');
            } else {
                // Send simple text response
                await sendWhatsAppContent(from, {
                    type: 'text',
                    content: "👋 Welcome to FinAdvise!\n\nClick the 'Retrieve Content' button to get:\n• 📊 Market charts\n• 📈 Analysis\n• 💡 Investment tips\n\nOr type 'content' to receive it now."
                });
            }
        }
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        type: 'Media Content Handler',
        features: ['text', 'images', 'sequences'],
        contentTypes: Object.keys(CONTENT_RESPONSES),
        phoneNumberId: CONFIG.phoneNumberId,
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ Ready to deliver media content');
    console.log('🖼️ Media types: Images + Text');
    console.log('🔘 Button IDs:', Object.keys(CONTENT_RESPONSES).join(', '));
});