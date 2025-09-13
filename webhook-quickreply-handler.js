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

console.log('🚀 WEBHOOK FOR QUICK REPLY BUTTON HANDLING');
console.log('⚡ Handles both button_reply and text messages from quick reply buttons\n');

// Content to deliver when button is clicked
const MARKET_CONTENT = `📊 Today's Market Analysis

🔍 MARKET OVERVIEW - ${new Date().toLocaleDateString()}

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

📱 Share this with your clients to add value!`;

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
        
        // Log the raw message for debugging
        console.log('\n📨 Incoming message structure:', JSON.stringify(message, null, 2));
        
        // Handle button clicks (both button_reply and quick_reply text)
        if (message.type === 'interactive') {
            // Check for button_reply (URL buttons)
            if (message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                const buttonTitle = message.interactive.button_reply.title;
                
                console.log(`\n🔘 URL Button clicked by ${from}`);
                console.log(`   Button: "${buttonTitle}" (${buttonId})`);
                
                await sendWhatsAppMessage(from, MARKET_CONTENT);
                console.log('   ✨ Content delivered successfully!\n');
            }
            // Check for list_reply or other interactive types
            else {
                console.log(`\n🔘 Interactive message from ${from}`);
                console.log(`   Type: ${message.interactive?.type}`);
            }
            
        } else if (message.type === 'text') {
            const text = message.text?.body || '';
            console.log(`\n💬 Text from ${from}: "${text}"`);
            
            // Check if this is a quick reply button click (text matches button text)
            if (text === 'Retrieve Content' || 
                text.toLowerCase().includes('retrieve') || 
                text.toLowerCase().includes('content')) {
                
                console.log('   📍 Quick reply button detected or content keyword found');
                await sendWhatsAppMessage(from, MARKET_CONTENT);
                console.log('   ✨ Content delivered successfully!\n');
                
            } else {
                // Send instructions for other text
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
        type: 'Quick Reply Button Handler',
        description: 'Handles quick reply buttons that send text',
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`📡 Webhook listening on port ${CONFIG.port}`);
    console.log('✅ Ready to handle quick reply buttons');
    console.log('💡 Quick reply buttons send text "Retrieve Content"');
});