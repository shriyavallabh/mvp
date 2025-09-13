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

console.log('🚀 COMPLETE SOLUTION WEBHOOK');

// Smart contextual responses based on keywords
function getSmartResponse(message) {
    const msg = message.toLowerCase();
    
    // Investment amount questions
    if (msg.match(/\d+/) && (msg.includes('invest') || msg.includes('have'))) {
        const amount = msg.match(/\d+/)[0];
        if (parseInt(amount) < 100000) {
            return `With ₹${amount}, I recommend: 40% in a Nifty 50 index fund for stability, 30% in a balanced mutual fund, 20% in a debt fund for safety, and keep 10% liquid. This gives you growth potential with managed risk. Start with SIPs if you want to invest gradually.`;
        } else {
            return `For ₹${amount}, consider: 35% in equity mutual funds (mix of large & mid-cap), 25% in index funds, 20% in debt instruments, 15% in gold ETFs, and 5% liquid. Diversification is key. Consider tax-saving ELSS funds if you haven't maxed Section 80C benefits.`;
        }
    }
    
    // Stocks vs mutual funds
    if (msg.includes('stock') && msg.includes('mutual')) {
        return "For beginners, mutual funds are better - professional management, diversification, and lower risk. Start with index funds or large-cap funds. Once you gain experience and can dedicate time to research, consider direct stocks. Most successful investors use both - 70% mutual funds for stability, 30% stocks for higher returns.";
    }
    
    // SIP questions
    if (msg.includes('sip')) {
        return "SIP (Systematic Investment Plan) is excellent for building wealth. Benefits: Rupee cost averaging, disciplined investing, and power of compounding. Start with ₹500-1000 monthly in a good equity fund. Increase by 10% yearly. Over 15-20 years, even small SIPs create significant wealth through compounding.";
    }
    
    // Risk questions
    if (msg.includes('risk') || msg.includes('safe')) {
        return "Your risk profile determines allocation: Conservative (70% debt, 30% equity), Moderate (50% debt, 50% equity), Aggressive (30% debt, 70% equity). Age rule: 100 minus your age = equity percentage. Always have 6 months expenses as emergency fund before investing.";
    }
    
    // Beginner questions
    if (msg.includes('begin') || msg.includes('start')) {
        return "Start investing with these steps: 1) Build emergency fund (6 months expenses), 2) Get health & term insurance, 3) Open demat account with Zerodha/Groww, 4) Start SIP in index fund, 5) Learn about different instruments. Begin with small amounts, increase as you learn.";
    }
    
    // Generic investment question
    if (msg.includes('invest')) {
        return "Smart investing requires clear goals. Short-term (1-3 years): Debt funds, FDs. Medium-term (3-5 years): Balanced funds, large-cap funds. Long-term (5+ years): Equity funds, stocks. Diversify across asset classes. What's your investment timeline and risk appetite?";
    }
    
    // Greeting
    if (msg.includes('hello') || msg.includes('hi')) {
        return "Hello! I'm your financial advisor. I can help with investment strategies, mutual funds, SIPs, stock market basics, and financial planning. What would you like to know about? For example, ask about 'how to invest 50000' or 'stocks vs mutual funds'.";
    }
    
    // Default
    return "I can help you with investment planning. Tell me: 1) How much you want to invest, 2) Your investment timeline, 3) Your risk tolerance. Or ask specific questions like 'should I invest in stocks or mutual funds?' or 'how to start SIP?'";
}

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
        
        console.log('   ✅ Sent! ID:', response.data.messages?.[0]?.id);
        return true;
    } catch (error) {
        console.error('   ❌ Failed:', error.response?.data?.error?.message || error.message);
        return false;
    }
}

app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && 
        req.query['hub.verify_token'] === CONFIG.verifyToken) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (message) {
        const from = message.from;
        const text = message.text?.body || '';
        
        console.log(`\n📨 From ${from}: "${text}"`);
        
        // Get smart contextual response
        const response = getSmartResponse(text);
        
        console.log(`   📤 Sending contextual advice (${response.length} chars)`);
        
        await sendWhatsAppMessage(from, response);
    }
    
    res.sendStatus(200);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        type: 'Smart contextual responses',
        timestamp: new Date()
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('✅ Webhook ready with SMART CONTEXTUAL responses');
    console.log('📊 Handles: investment amounts, SIP, stocks vs MF, risk, etc.');
});
