const express = require('express');
const app = express();
app.use(express.json());

const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

console.log('🚀 LOCAL WEBHOOK STARTING...');

// Meta webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`Verification: mode=${mode}, token=${token}, challenge=${challenge}`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ WEBHOOK VERIFIED!');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Verification failed');
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', (req, res) => {
    console.log('📨 Webhook event received');
    res.status(200).send('OK');
    
    const entry = req.body.entry?.[0];
    const messages = entry?.changes?.[0]?.value?.messages || [];
    
    for (const message of messages) {
        console.log(`Message from ${message.from}: ${message.type}`);
        if (message.type === 'text') {
            console.log(`Text: ${message.text.body}`);
        }
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Webhook is running! Use /webhook endpoint for Meta verification.');
});

app.listen(CONFIG.port, () => {
    console.log(`✅ Webhook running on http://localhost:${CONFIG.port}`);
    console.log('📍 Ready for ngrok tunnel');
});