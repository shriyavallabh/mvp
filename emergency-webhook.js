const express = require('express');
const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

console.log('🚀 EMERGENCY WEBHOOK STARTING...');

// CRITICAL: Webhook verification endpoint for Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Verification request:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified successfully');
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
    
    // Process the webhook event
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    
    for (const message of messages) {
        console.log(`Message from ${message.from}: ${message.type}`);
        
        if (message.type === 'text') {
            console.log(`Text: ${message.text.body}`);
        } else if (message.type === 'interactive') {
            console.log(`Button: ${message.interactive?.button_reply?.id}`);
        }
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'emergency-webhook',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Webhook Active',
        endpoints: ['/webhook', '/health']
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`✅ Webhook running on port ${CONFIG.port}`);
    console.log(`📍 Ready for Meta verification`);
});
