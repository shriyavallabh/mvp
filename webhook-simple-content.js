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

console.log('🚀 SIMPLIFIED CONTENT WEBHOOK');
console.log('📱 Phone Number ID:', CONFIG.phoneNumberId);

// Simple content - just text, no images
const CONTENT_LIBRARY = {
    'RETRIEVE_CONTENT': `📊 *MARKET UPDATE - ${new Date().toLocaleDateString()}*

📈 *TODAY'S HIGHLIGHTS:*
• Nifty: 19,875 (+1.2%) ↗️
• Sensex: 65,432 (+0.9%) ↗️

💎 *TOP PICKS:*
1️⃣ HDFC Bank - Target: ₹1,750
2️⃣ Reliance - Target: ₹2,950

💡 *STRATEGY:*
✅ Buy on dips
⚠️ Book profits at highs

_Share with your clients!_`
};

// Send simple WhatsApp message
async function sendMessage(to, message) {
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
        
        console.log('   ✅ Message sent! ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data?.error?.message || error.message);
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
    
    console.log('\n📥 Webhook received:', JSON.stringify(req.body, null, 2));
    
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
            
            // Send simple content
            const content = CONTENT_LIBRARY[buttonId] || CONTENT_LIBRARY['RETRIEVE_CONTENT'];
            
            console.log('   📤 Sending content...');
            const success = await sendMessage(from, content);
            
            if (success) {
                console.log('   ✨ Content delivered successfully!\n');
            } else {
                console.log('   ❌ Content delivery failed!\n');
            }
            
        } else if (message.type === 'text') {
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`\n💬 Text from ${from}: "${text}"`);
            
            if (text.includes('content') || text.includes('unlock') || text.includes('retrieve')) {
                await sendMessage(from, CONTENT_LIBRARY['RETRIEVE_CONTENT']);
            } else {
                await sendMessage(from, "👋 Welcome! Click 'Retrieve Content' button for market updates.");
            }
        }
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        type: 'Simple Content Handler',
        timestamp: new Date(),
        phoneNumberId: CONFIG.phoneNumberId
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ Ready to handle button clicks');
    console.log('📝 Simple text content only');
});