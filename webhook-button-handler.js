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

console.log('🚀 WEBHOOK FOR BUTTON CLICK HANDLING');

// Content to deliver when button is clicked
const CONTENT_LIBRARY = {
    'RETRIEVE_CONTENT': {
        title: '📊 Today\'s Market Analysis',
        content: `🔍 MARKET OVERVIEW - ${new Date().toLocaleDateString()}

📈 EQUITY MARKETS:
• Nifty 50: 19,875 (+1.2%)
• Sensex: 65,432 (+0.9%)
• Bank Nifty: 44,250 (+1.5%)

💡 TOP OPPORTUNITIES:
1. Large-cap IT stocks showing strength
2. Banking sector poised for rally
3. Pharma stocks at attractive valuations

📌 RECOMMENDED ACTIONS:
• Accumulate quality large-caps on dips
• Book partial profits in mid-caps
• Maintain 20% cash for opportunities

🎯 FOCUS SECTORS:
• IT Services (TCS, Infosys)
• Private Banks (HDFC, ICICI)
• FMCG defensive plays

⚠️ RISK FACTORS:
• Global rate uncertainties
• Crude oil above $85
• FII selling pressure

📱 Share this with your clients to add value!`
    },
    'UNLOCK_CONTENT': {
        title: '🔓 Premium Content Unlocked',
        content: `📚 EXCLUSIVE INSIGHTS

Today's premium content includes detailed analysis of:
• Sector rotation strategies
• Options trading setups
• Portfolio rebalancing guide

Access full report at: finadvise.in/daily`
    },
    'SHARE_WITH_CLIENTS': {
        title: '📤 Client-Ready Content',
        content: `Here's today's content formatted for your clients:

"Dear Investor,
Markets are showing positive momentum. Our recommended portfolio changes:
1. Increase equity allocation to 65%
2. Focus on quality large-caps
3. Maintain SIP discipline

Your advisor is monitoring opportunities."

Copy and forward to clients!`
    }
};

async function sendWhatsAppMessage(to, message) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('   ✅ Content delivered! ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('   ❌ Delivery failed:', error.response?.data?.error?.message || error.message);
        return false;
    }
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
            
            // Get content based on button ID
            const content = CONTENT_LIBRARY[buttonId] || CONTENT_LIBRARY['RETRIEVE_CONTENT'];
            
            // Send the content
            const fullMessage = `${content.title}\n\n${content.content}`;
            await sendWhatsAppMessage(from, fullMessage);
            
            console.log('   ✨ Content delivered successfully!\n');
            
        } else if (message.type === 'text') {
            // Handle text messages
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`\n💬 Text from ${from}: "${text}"`);
            
            if (text.includes('content') || text.includes('unlock') || text.includes('retrieve')) {
                // Send content if they type content-related keywords
                const content = CONTENT_LIBRARY['RETRIEVE_CONTENT'];
                const fullMessage = `${content.title}\n\n${content.content}`;
                await sendWhatsAppMessage(from, fullMessage);
            } else {
                // Send instructions
                await sendWhatsAppMessage(from, 
                    "👋 Welcome to FinAdvise!\n\n" +
                    "Click the 'Retrieve Content' button in the template message to get today's market insights.\n\n" +
                    "Or type 'content' to receive it now."
                );
            }
        }
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        type: 'Button Click Handler',
        contentTypes: Object.keys(CONTENT_LIBRARY),
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ Ready to handle button clicks');
    console.log('📚 Content library loaded');
    console.log('🔘 Supported buttons:', Object.keys(CONTENT_LIBRARY).join(', '));
});
