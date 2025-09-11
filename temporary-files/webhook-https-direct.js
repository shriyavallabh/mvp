const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const https = require('https');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    httpsPort: 443  // Standard HTTPS port
};

console.log('\n🔒 HTTPS WEBHOOK SERVER STARTING');
console.log('==================================');
console.log('Running on port 443 (HTTPS)');
console.log('No port needed in URL!\n');

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔍 Verification request from Meta');
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.sendStatus(403);
    }
});

// Webhook events
app.post('/webhook', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
    
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages || [];
        
        for (const message of messages) {
            console.log(`📨 Message from ${message.from}`);
            
            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                console.log(`🔘 Button clicked: ${buttonId}`);
                
                if (buttonId.includes('UNLOCK')) {
                    await sendContent(message.from);
                }
            } else if (message.type === 'text') {
                const text = message.text.body;
                console.log(`💬 Text: ${text}`);
                await sendReply(message.from, `Got your message: "${text}"`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function sendReply(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Reply sent');
    } catch (error) {
        console.error('Send error:', error.response?.data || error.message);
    }
}

async function sendContent(to) {
    const messages = [
        '📊 *Market Update*\nNifty: 19,800 (+1.2%)\nSensex: 66,500 (+380)',
        '💡 *Investment Tip*\nConsider large-cap funds for stability',
        '🎯 *Action Item*\nReview client portfolios this week'
    ];
    
    for (const msg of messages) {
        await sendReply(to, msg);
        await new Promise(r => setTimeout(r, 1000));
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        protocol: 'HTTPS',
        port: CONFIG.httpsPort
    });
});

// Check if certificates exist, if not create them
const certPath = '/etc/ssl/webhook';
const keyFile = `${certPath}/private.key`;
const certFile = `${certPath}/certificate.crt`;

if (!fs.existsSync(certPath)) {
    console.log('Creating SSL certificate directory...');
    fs.mkdirSync(certPath, { recursive: true });
}

if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
    console.log('⚠️  SSL certificates not found!');
    console.log('Run setup-https-certificates.sh first');
    process.exit(1);
}

// Create HTTPS server
const httpsOptions = {
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile)
};

https.createServer(httpsOptions, app).listen(CONFIG.httpsPort, '0.0.0.0', () => {
    console.log(`✅ HTTPS server running on port ${CONFIG.httpsPort}`);
    console.log(`\n📍 YOUR WEBHOOK URL (HTTPS):`);
    console.log(`   https://YOUR_VM_IP/webhook`);
    console.log(`\n🔑 VERIFY TOKEN:`);
    console.log(`   ${CONFIG.verifyToken}\n`);
});